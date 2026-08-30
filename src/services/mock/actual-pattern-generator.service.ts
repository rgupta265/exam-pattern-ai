import { prisma } from "@/lib/prisma";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { MockPatternValidatorService } from "./mock-pattern-validator.service";
import { geminiQuestionService } from "@/services/ai/gemini-question.service";
import { AIScopeGuard } from "@/services/ai/ai-scope-guard.service";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { Prisma, DifficultyLevel, MockPublishStatus } from "@prisma/client";

export interface MockGenerationPlanSection {
  sectionName: string;
  sectionOrder: number;
  questionCount: number;
  marksPerQuestion: number;
  negativeRate: number;
  topicAllocations: Array<{
    topicId: string;
    topicName: string;
    questionCount: number;
  }>;
}

export interface MockGenerationPlan {
  examId: string;
  examName: string;
  examVersionId: string;
  versionName: string;
  advertisementNumber?: string | null;
  blueprintId: string;
  blueprintTitle: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarkingRate: number;
  sections: MockGenerationPlanSection[];
  verifiedDocuments: Array<{ id: string; title: string; type: string }>;
}

export class ActualPatternGeneratorService {
  // Idempotency lock map to prevent double-click race conditions
  private static readonly activeGenerations = new Set<string>();

  /**
   * Helper to format unique mock code like UPHO-2026-MOCK-001
   */
  private static async getNextMockSequenceAndCode(
    examCode: string,
    year: number,
    examVersionId: string
  ): Promise<{ sequence: number; code: string }> {
    const count = await prisma.mockTest.count({
      where: { examVersionId, type: "FULL_MOCK" },
    });
    const sequence = count + 1;
    const sanitizedCode = (examCode || "EXAM").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const code = `${sanitizedCode}-${year}-MOCK-${sequence.toString().padStart(3, "0")}`;
    return { sequence, code };
  }

  /**
   * Build deterministic generation plan from authoritative locked blueprint & verified syllabus
   */
  public static async buildGenerationPlan(examVersionId: string): Promise<MockGenerationPlan> {
    const readiness = await DocumentReadinessService.checkDocumentReadiness(examVersionId);

    if (!readiness.isReadyForMockGeneration) {
      const missingDetails = readiness.missingRequiredDocuments.join(", ");
      throw new BadRequestError(
        `Cannot generate actual-pattern mock test: Missing required verified documents or configuration (${missingDetails || "Blueprint/Syllabus not verified"}).`
      );
    }

    const examVersion = await prisma.examVersion.findUnique({
      where: { id: examVersionId },
      include: {
        exam: true,
        documents: { where: { status: "VERIFIED" } },
        blueprints: {
          where: { status: { in: ["LOCKED", "ACTIVE", "VERIFIED"] } },
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: {
            sections: { orderBy: { sectionOrder: "asc" } },
            rules: true,
          },
        },
        syllabi: {
          where: { isVerified: true },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sections: {
              orderBy: { sortOrder: "asc" },
              include: {
                topics: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!examVersion) throw new NotFoundError("Exam Version");

    const blueprint = examVersion.blueprints[0];
    const syllabus = examVersion.syllabi[0];

    if (!blueprint || !syllabus) {
      throw new BadRequestError("Authoritative blueprint or syllabus is missing for this exam version.");
    }

    const allSyllabusTopics = syllabus.sections.flatMap((s) => s.topics);
    if (allSyllabusTopics.length === 0) {
      throw new BadRequestError("Verified syllabus contains no topics.");
    }

    // Build section-by-section plan with deterministic topic distribution
    const plannedSections: MockGenerationPlanSection[] = [];

    for (const bpSec of blueprint.sections) {
      // Find matching syllabus section or fallback to pool
      const matchedSylSec =
        syllabus.sections.find((s) => s.sortOrder === bpSec.sectionOrder) ||
        syllabus.sections.find((s) => s.name.toLowerCase() === bpSec.name.toLowerCase()) ||
        syllabus.sections[bpSec.sectionOrder - 1] ||
        syllabus.sections[0];

      const topicPool = matchedSylSec && matchedSylSec.topics.length > 0
        ? matchedSylSec.topics
        : allSyllabusTopics;

      // Allocate questions across topics deterministically
      const topicAllocations: Array<{ topicId: string; topicName: string; questionCount: number }> = [];
      const basePerTopic = Math.floor(bpSec.questionCount / topicPool.length);
      let remainder = bpSec.questionCount % topicPool.length;

      for (let i = 0; i < topicPool.length; i++) {
        const topic = topicPool[i];
        const count = basePerTopic + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;

        if (count > 0) {
          topicAllocations.push({
            topicId: topic.id,
            topicName: topic.name,
            questionCount: count,
          });
        }
      }

      plannedSections.push({
        sectionName: bpSec.name,
        sectionOrder: bpSec.sectionOrder,
        questionCount: bpSec.questionCount,
        marksPerQuestion: Number(bpSec.marksPerQuestion),
        negativeRate: Number(bpSec.negativeRate),
        topicAllocations,
      });
    }

    return {
      examId: examVersion.exam.id,
      examName: examVersion.exam.name,
      examVersionId: examVersion.id,
      versionName: examVersion.versionName,
      advertisementNumber: examVersion.notificationNumber,
      blueprintId: blueprint.id,
      blueprintTitle: blueprint.title,
      totalQuestions: blueprint.totalQuestions,
      totalMarks: Number(blueprint.totalMarks),
      durationMinutes: blueprint.durationMinutes,
      negativeMarkingRate: Number(blueprint.negativeMarkingRate),
      sections: plannedSections,
      verifiedDocuments: examVersion.documents.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.documentType,
      })),
    };
  }

  /**
   * One-Click Execution of Actual Pattern Mock Generation
   */
  public static async generateActualPatternMock(params: {
    examVersionId: string;
    customTitle?: string;
    user: SessionUser;
    ip?: string;
    userAgent?: string;
  }) {
    RbacService.requirePermission(params.user, PERMISSIONS.MOCK_CREATE);

    // Idempotency lock
    const lockKey = `actual-pattern-${params.examVersionId}`;
    if (this.activeGenerations.has(lockKey)) {
      throw new BadRequestError("A mock generation job is already in progress for this exam version. Please wait.");
    }

    this.activeGenerations.add(lockKey);

    try {
      // 1. Validate & Build Authoritative Plan
      const plan = await this.buildGenerationPlan(params.examVersionId);

      const examVersion = await prisma.examVersion.findUnique({
        where: { id: params.examVersionId },
        include: { exam: true },
      });
      if (!examVersion) throw new NotFoundError("Exam Version");

      // 2. Track Generation Request
      const genRequest = await prisma.mockGenerationRequest.create({
        data: {
          examVersionId: plan.examVersionId,
          requestedById: params.user.id,
          status: "PROCESSING",
          criteria: {
            mode: "ACTUAL_PATTERN_ONE_CLICK",
            blueprintId: plan.blueprintId,
            totalQuestions: plan.totalQuestions,
            totalMarks: plan.totalMarks,
            durationMinutes: plan.durationMinutes,
            sectionsCount: plan.sections.length,
          },
        },
      });

      // 3. Generate Code and Master Mock Record in GENERATING state
      const { sequence, code: mockCode } = await this.getNextMockSequenceAndCode(
        examVersion.exam.code,
        examVersion.year,
        examVersion.id
      );

      const mockTitle =
        params.customTitle ||
        `${examVersion.exam.name} ${examVersion.year} Official Pattern Mock #${sequence}`;
      const mockSlug = `${examVersion.exam.slug}-${examVersion.year}-actual-mock-${sequence}-${Date.now().toString(36)}`;

      const mockTest = await prisma.mockTest.create({
        data: {
          code: mockCode,
          examVersionId: plan.examVersionId,
          blueprintId: plan.blueprintId,
          type: "FULL_MOCK",
          sequence,
          title: mockTitle,
          slug: mockSlug,
          durationMinutes: plan.durationMinutes,
          totalQuestions: plan.totalQuestions,
          totalMarks: new Prisma.Decimal(plan.totalMarks),
          negativeRate: new Prisma.Decimal(plan.negativeMarkingRate),
          difficulty: DifficultyLevel.MEDIUM,
          language: "BILINGUAL",
          generationType: "BLUEPRINT_ACTUAL_PATTERN",
          createdById: params.user.id,
          status: MockPublishStatus.GENERATING,
        },
      });

      // 4. Generate questions strictly conforming to the plan section by section
      let overallQuestionOrder = 1;

      for (const plannedSec of plan.sections) {
        const mockSec = await prisma.mockTestSection.create({
          data: {
            mockTestId: mockTest.id,
            name: plannedSec.sectionName,
            sectionOrder: plannedSec.sectionOrder,
            questionCount: plannedSec.questionCount,
            marksPerQuestion: new Prisma.Decimal(plannedSec.marksPerQuestion),
            negativeRate: new Prisma.Decimal(plannedSec.negativeRate),
          },
        });

        for (const alloc of plannedSec.topicAllocations) {
          // AI Scope verification
          AIScopeGuard.validate({
            taskType: "MOCK_GENERATION",
            examId: plan.examId,
            examVersionId: plan.examVersionId,
            examName: plan.examName,
            authority: examVersion.exam.authority,
            allowedTopics: [alloc.topicName],
            allowedQuestionTypes: ["SINGLE_CHOICE"],
            allowedLanguages: ["English", "Hindi"],
            requestedTopic: alloc.topicName,
            requestedQuestionCount: alloc.questionCount,
          });

          const generatedBatch = await geminiQuestionService.generateQuestions({
            examName: plan.examName,
            authority: examVersion.exam.authority,
            versionName: plan.versionName,
            sectionName: plannedSec.sectionName,
            topicName: alloc.topicName,
            questionCount: alloc.questionCount,
            difficulty: "MEDIUM",
            language: "English",
            marksPerQuestion: plannedSec.marksPerQuestion,
            negativeRate: plannedSec.negativeRate,
          });

          for (const qData of generatedBatch.questions) {
            const newQuestion = await prisma.question.create({
              data: {
                topicId: alloc.topicId,
                questionType: "SINGLE_CHOICE",
                difficulty: qData.difficulty,
                status: "APPROVED",
                questionText: qData.questionText.trim(),
                questionTextHindi: qData.questionTextHindi || null,
                explanation: qData.explanation.trim(),
                explanationHindi: qData.explanationHindi || null,
                subtopic: qData.subtopic || null,
                marks: new Prisma.Decimal(plannedSec.marksPerQuestion),
                negativeMarks: new Prisma.Decimal(plannedSec.negativeRate),
                source: "AI_GENERATED",
                isAiGenerated: true,
                isAiValidated: true,
                isHumanVerified: true,
                options: {
                  create: qData.options.map((opt, optIdx) => ({
                    optionKey: opt.key,
                    optionText: opt.text,
                    optionTextHindi: opt.textHindi || null,
                    isCorrect: opt.isCorrect || opt.key === qData.correctAnswer,
                    sortOrder: optIdx,
                  })),
                },
              },
            });

            await prisma.mockTestQuestion.create({
              data: {
                mockTestId: mockTest.id,
                mockTestSectionId: mockSec.id,
                questionId: newQuestion.id,
                questionOrder: overallQuestionOrder++,
                marks: new Prisma.Decimal(plannedSec.marksPerQuestion),
                negativeMarks: new Prisma.Decimal(plannedSec.negativeRate),
              },
            });
          }
        }
      }

      // 5. Pattern Validation Engine Execution
      const validationReport = await MockPatternValidatorService.validate(mockTest.id);

      if (!validationReport.isValid) {
        await prisma.mockTest.update({
          where: { id: mockTest.id },
          data: { status: MockPublishStatus.VALIDATION_FAILED },
        });

        await prisma.mockGenerationRequest.update({
          where: { id: genRequest.id },
          data: {
            mockTestId: mockTest.id,
            status: "FAILED",
            errorMessage: `Pattern validation failed: ${validationReport.errors.join("; ")}`,
            completedAt: new Date(),
          },
        });

        throw new BadRequestError(
          `Generated mock failed pattern compliance validation: ${validationReport.errors.join("; ")}`
        );
      }

      // 6. Mark Published and Complete
      const publishedMock = await prisma.mockTest.update({
        where: { id: mockTest.id },
        data: {
          status: MockPublishStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: {
          sections: {
            include: { questions: true },
          },
        },
      });

      await prisma.mockGenerationRequest.update({
        where: { id: genRequest.id },
        data: {
          mockTestId: mockTest.id,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await AuditService.log({
        userId: params.user.id,
        action: "ACTUAL_PATTERN_MOCK_GENERATED",
        resourceType: "MockTest",
        resourceId: mockTest.id,
        ipAddress: params.ip,
        userAgent: params.userAgent,
        changesDiff: {
          code: mockCode,
          sequence,
          blueprintId: plan.blueprintId,
          totalQuestions: plan.totalQuestions,
          totalMarks: plan.totalMarks,
          durationMinutes: plan.durationMinutes,
          is100PercentCompliant: validationReport.isValid,
        },
      });

      return {
        mockTest: publishedMock,
        validationReport,
        plan,
      };
    } finally {
      this.activeGenerations.delete(lockKey);
    }
  }
}
