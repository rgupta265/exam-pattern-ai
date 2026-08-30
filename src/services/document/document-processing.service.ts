import { prisma } from "@/lib/prisma";
import { storageService } from "@/services/storage";
import { geminiDocumentService } from "@/services/ai/gemini-document.service";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { NotFoundError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

export class DocumentProcessingService {
  /**
   * Process an uploaded official document with Gemini AI and generate structured blueprint & syllabus drafts
   */
  public static async processDocument(
    documentId: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.DOCUMENT_PROCESS);

    const document = await prisma.examDocument.findUnique({
      where: { id: documentId },
      include: {
        file: true,
        examVersion: {
          include: { exam: true },
        },
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new NotFoundError("Exam Document");
    }

    // Retrieve or create processing job
    let job = document.jobs[0];
    if (!job || job.status === "COMPLETED") {
      job = await prisma.documentProcessingJob.create({
        data: {
          documentId: document.id,
          jobType: "AI_PATTERN_AND_SYLLABUS_EXTRACTION",
          status: "PROCESSING",
          startedAt: new Date(),
        },
      });
    } else {
      job = await prisma.documentProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "PROCESSING",
          startedAt: new Date(),
          errorMessage: null,
        },
      });
    }

    await prisma.examVersion.update({
      where: { id: document.examVersionId },
      data: { status: "PROCESSING" },
    });

    try {
      // 1. Read document buffer from secure local storage
      const fileBuffer = await storageService.readFile(document.file.storagePath);
      const rawText = fileBuffer.toString("utf-8");

      // 2. Perform Gemini AI analysis with strict Zod validation
      const extraction = await geminiDocumentService.analyzeOfficialDocument({
        documentTitle: document.title,
        documentType: document.documentType,
        rawTextContent: rawText,
        knownExamName: document.examVersion.exam.name,
        knownYear: document.examVersion.year,
      });

      // 3. Persist extraction within an atomic transaction
      await prisma.$transaction(async (tx) => {
        // Save extracted structured data to job
        await tx.documentProcessingJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            extractedData: extraction as unknown as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });

        // Determine latest version number for blueprint
        const existingBlueprints = await tx.examBlueprint.findMany({
          where: { examVersionId: document.examVersionId },
          orderBy: { versionNumber: "desc" },
          take: 1,
        });
        const nextVersionNum = (existingBlueprints[0]?.versionNumber || 0) + 1;

        // Create AI_ANALYZED blueprint draft
        const blueprint = await tx.examBlueprint.create({
          data: {
            examVersionId: document.examVersionId,
            versionNumber: nextVersionNum,
            title: extraction.pattern.title || `Blueprint V${nextVersionNum} (${document.title})`,
            totalQuestions: extraction.pattern.totalQuestions,
            totalMarks: new Prisma.Decimal(extraction.pattern.totalMarks),
            durationMinutes: extraction.pattern.durationMinutes,
            negativeMarkingRate: new Prisma.Decimal(extraction.pattern.negativeMarkingRate),
            hasNegativeMarking: extraction.pattern.hasNegativeMarking,
            status: "AI_ANALYZED",
            instructions: extraction.pattern.instructions || null,
            sections: {
              create: extraction.sections.map((sec) => ({
                name: sec.name,
                sectionOrder: sec.sectionOrder,
                questionCount: sec.questionCount,
                marksPerQuestion: new Prisma.Decimal(sec.marksPerQuestion),
                totalMarks: new Prisma.Decimal(sec.totalMarks),
                negativeRate: new Prisma.Decimal(sec.negativeRate),
                instructions: sec.instructions || null,
              })),
            },
            rules: {
              create: extraction.rules.map((r) => ({
                ruleType: r.ruleType,
                ruleConfig: r.ruleConfig as Prisma.InputJsonValue,
                description: r.description || null,
              })),
            },
          },
        });

        // Create Draft Syllabus if extracted
        if (extraction.syllabus && extraction.syllabus.length > 0) {
          await tx.syllabus.create({
            data: {
              examVersionId: document.examVersionId,
              title: `Official Syllabus (${document.title})`,
              isVerified: false,
              sections: {
                create: extraction.syllabus.map((sec) => ({
                  name: sec.name,
                  code: sec.code || null,
                  description: sec.description || null,
                  sortOrder: sec.sortOrder,
                  topics: {
                    create: sec.topics.map((t) => ({
                      name: t.name,
                      code: t.code || null,
                      description: t.description || null,
                      weightagePercentage: t.weightagePercentage !== null && t.weightagePercentage !== undefined
                        ? new Prisma.Decimal(t.weightagePercentage)
                        : null,
                      sortOrder: t.sortOrder,
                    })),
                  },
                })),
              },
            },
          });
        }

        // Update exam version status to UNDER_REVIEW
        await tx.examVersion.update({
          where: { id: document.examVersionId },
          data: { status: "UNDER_REVIEW" },
        });

        return blueprint;
      });

      await AuditService.log({
        userId: user.id,
        action: "DOCUMENT_PROCESS_COMPLETE",
        resourceType: "ExamDocument",
        resourceId: document.id,
        ipAddress: ip,
        userAgent,
        changesDiff: { documentId: document.id, status: "COMPLETED" },
      });

      return { success: true, extraction };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Document processing failed";

      await prisma.documentProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage,
          completedAt: new Date(),
        },
      });

      await prisma.examVersion.update({
        where: { id: document.examVersionId },
        data: { status: "DRAFT" },
      });

      await AuditService.log({
        userId: user.id,
        action: "DOCUMENT_PROCESS_FAILED",
        resourceType: "ExamDocument",
        resourceId: document.id,
        ipAddress: ip,
        userAgent,
        changesDiff: { error: errorMessage },
      });

      throw err;
    }
  }
}
