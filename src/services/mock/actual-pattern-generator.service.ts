import { prisma } from "@/lib/prisma";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { MockPatternValidatorService } from "./mock-pattern-validator.service";
import { geminiQuestionService } from "@/services/ai/gemini-question.service";
import { AIScopeGuard } from "@/services/ai/ai-scope-guard.service";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { BadRequestError, NotFoundError, ValidationError } from "@/lib/errors";
import { Prisma, DifficultyLevel, MockPublishStatus } from "@prisma/client";

export interface MockGenerationPlanSection {
  sectionId?: string;
  sectionName: string;
  sectionOrder: number;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  negativeRate: number;
  availableQuestionsCount: number;
  missingQuestionsCount: number;
  topicAllocations: Array<{
    topicId: string;
    topicName: string;
    questionCount: number;
    availableQuestionsCount: number;
  }>;
}

export interface MockGenerationPlan {
  examId: string;
  examName: string;
  examCode: string;
  examVersionId: string;
  versionName: string;
  advertisementNumber?: string | null;
  blueprintId: string;
  blueprintTitle: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarkingRate: number;
  difficulty: string;
  language: string;
  totalAvailableQuestions: number;
  totalMissingQuestions: number;
  isQuestionBankSufficient: boolean;
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
   * Build deterministic generation plan and query Question Bank availability from authoritative locked blueprint & verified syllabus
   */
  public static async buildGenerationPlan(
    examVersionId: string,
    blueprintId?: string
  ): Promise<MockGenerationPlan> {
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
          where: blueprintId
            ? { id: blueprintId }
            : { status: { in: ["LOCKED", "ACTIVE", "VERIFIED"] } },
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

    // Build section-by-section plan with deterministic topic distribution and Question Bank availability
    const plannedSections: MockGenerationPlanSection[] = [];
    let totalAvailableAcrossAll = 0;
    let totalMissingAcrossAll = 0;

    for (const bpSec of blueprint.sections) {
      // Find matching syllabus section or fallback to pool
      const matchedSylSec =
        syllabus.sections.find((s) => s.sortOrder === bpSec.sectionOrder) ||
        syllabus.sections.find((s) => s.name.toLowerCase() === bpSec.name.toLowerCase()) ||
        syllabus.sections[bpSec.sectionOrder - 1] ||
        syllabus.sections[0];

      const topicPool =
        matchedSylSec && matchedSylSec.topics.length > 0
          ? matchedSylSec.topics
          : allSyllabusTopics;

      const topicIds = topicPool.map((t) => t.id);

      // Query available approved questions in question bank for this section's topics
      const availableQuestionsForSection = await prisma.question.count({
        where: {
          topicId: { in: topicIds },
          status: "APPROVED",
          deletedAt: null,
        },
      });

      // Allocate questions across topics deterministically
      const topicAllocations: MockGenerationPlanSection["topicAllocations"] = [];
      const basePerTopic = Math.floor(bpSec.questionCount / topicPool.length);
      let remainder = bpSec.questionCount % topicPool.length;

      for (let i = 0; i < topicPool.length; i++) {
        const topic = topicPool[i];
        const count = basePerTopic + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;

        if (count > 0) {
          const topicAvailable = await prisma.question.count({
            where: {
              topicId: topic.id,
              status: "APPROVED",
              deletedAt: null,
            },
          });

          topicAllocations.push({
            topicId: topic.id,
            topicName: topic.name,
            questionCount: count,
            availableQuestionsCount: topicAvailable,
          });
        }
      }

      const missingForSection = Math.max(0, bpSec.questionCount - availableQuestionsForSection);
      totalAvailableAcrossAll += availableQuestionsForSection;
      totalMissingAcrossAll += missingForSection;

      plannedSections.push({
        sectionId: bpSec.id,
        sectionName: bpSec.name,
        sectionOrder: bpSec.sectionOrder,
        questionCount: bpSec.questionCount,
        marksPerQuestion: Number(bpSec.marksPerQuestion),
        totalMarks: Number(bpSec.totalMarks),
        negativeRate: Number(bpSec.negativeRate),
        availableQuestionsCount: availableQuestionsForSection,
        missingQuestionsCount: missingForSection,
        topicAllocations,
      });
    }

    return {
      examId: examVersion.exam.id,
      examName: examVersion.exam.name,
      examCode: examVersion.exam.code,
      examVersionId: examVersion.id,
      versionName: examVersion.versionName,
      advertisementNumber: examVersion.notificationNumber,
      blueprintId: blueprint.id,
      blueprintTitle: blueprint.title,
      totalQuestions: blueprint.totalQuestions,
      totalMarks: Number(blueprint.totalMarks),
      durationMinutes: blueprint.durationMinutes,
      negativeMarkingRate: Number(blueprint.negativeMarkingRate),
      difficulty: "MEDIUM",
      language: "BILINGUAL",
      totalAvailableQuestions: totalAvailableAcrossAll,
      totalMissingQuestions: totalMissingAcrossAll,
      isQuestionBankSufficient: totalAvailableAcrossAll >= blueprint.totalQuestions,
      sections: plannedSections,
      verifiedDocuments: examVersion.documents.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.documentType,
      })),
    };
  }

  /**
   * One-Click Execution of Full Pattern-Based Mock Test Generation
   */
  public static async generateActualPatternMock(params: {
    examVersionId: string;
    blueprintId?: string;
    customTitle?: string;
    generationMode?: "FULL_PATTERN" | "QUICK";
    generateMissingWithAi?: boolean;
    quickQuestionCount?: number;
    user: SessionUser;
    ip?: string;
    userAgent?: string;
  }) {
    RbacService.requirePermission(params.user, PERMISSIONS.MOCK_CREATE);

    const isFullPattern = (params.generationMode || "FULL_PATTERN") === "FULL_PATTERN";
    const generateMissingWithAi = params.generateMissingWithAi !== false; // Default true

    // Idempotency lock
    const lockKey = `actual-pattern-${params.examVersionId}`;
    if (this.activeGenerations.has(lockKey)) {
      throw new BadRequestError("A mock generation job is already in progress for this exam version. Please wait.");
    }

    this.activeGenerations.add(lockKey);

    try {
      // 1. Validate & Build Authoritative Plan with Question Bank Availability
      const plan = await this.buildGenerationPlan(params.examVersionId, params.blueprintId);

      const examVersion = await prisma.examVersion.findUnique({
        where: { id: params.examVersionId },
        include: { exam: true },
      });
      if (!examVersion) throw new NotFoundError("Exam Version");

      // 2. Validate Question Bank sufficiency if AI generation of missing questions is disabled
      if (isFullPattern && !generateMissingWithAi && !plan.isQuestionBankSufficient) {
        const missingBreakdown = plan.sections
          .filter((s) => s.missingQuestionsCount > 0)
          .map((s) => `${s.sectionName}: ${s.missingQuestionsCount} missing (${s.availableQuestionsCount} available / ${s.questionCount} required)`)
          .join("; ");

        throw new ValidationError(
          `Unable to generate the full mock test. The selected pattern requires ${plan.totalQuestions} questions, but only ${plan.totalAvailableQuestions} suitable questions are currently available. Missing: ${missingBreakdown}. Enable AI Generation for missing questions to proceed.`
        );
      }

      // 3. Track Generation Request
      const genRequest = await prisma.mockGenerationRequest.create({
        data: {
          examVersionId: plan.examVersionId,
          requestedById: params.user.id,
          status: "PROCESSING",
          criteria: {
            mode: isFullPattern ? "FULL_PATTERN_BASED" : "QUICK_PARTIAL",
            blueprintId: plan.blueprintId,
            totalQuestions: isFullPattern ? plan.totalQuestions : (params.quickQuestionCount || 20),
            totalMarks: plan.totalMarks,
            durationMinutes: plan.durationMinutes,
            sectionsCount: plan.sections.length,
            generateMissingWithAi,
          },
        },
      });

      // 4. Generate Code and Master Mock Record in GENERATING state
      const { sequence, code: mockCode } = await this.getNextMockSequenceAndCode(
        examVersion.exam.code,
        examVersion.year,
        examVersion.id
      );

      const mockTitle =
        params.customTitle ||
        (isFullPattern
          ? `${examVersion.exam.name} ${examVersion.year} Full Pattern Mock #${sequence}`
          : `${examVersion.exam.name} Quick Mock #${sequence}`);

      const mockSlug = `${examVersion.exam.slug}-${examVersion.year}-${isFullPattern ? "full-pattern-mock" : "quick-mock"}-${sequence}-${Date.now().toString(36)}`;

      const targetTotalQuestions = isFullPattern ? plan.totalQuestions : Math.min(params.quickQuestionCount || 20, plan.totalQuestions);
      const targetDurationMinutes = isFullPattern ? plan.durationMinutes : Math.max(15, Math.round(targetTotalQuestions * 1.2));

      const mockTest = await prisma.mockTest.create({
        data: {
          code: mockCode,
          examVersionId: plan.examVersionId,
          blueprintId: plan.blueprintId,
          type: "FULL_MOCK",
          sequence,
          title: mockTitle,
          slug: mockSlug,
          durationMinutes: targetDurationMinutes,
          totalQuestions: targetTotalQuestions,
          totalMarks: new Prisma.Decimal(plan.totalMarks),
          negativeRate: new Prisma.Decimal(plan.negativeMarkingRate),
          difficulty: DifficultyLevel.MEDIUM,
          language: "BILINGUAL",
          generationType: isFullPattern ? "FULL_PATTERN_BASED" : "QUICK_PARTIAL",
          createdById: params.user.id,
          status: MockPublishStatus.GENERATING,
        },
      });

      // 5. Generate / Assemble questions strictly conforming to the plan section by section
      let overallQuestionOrder = 1;
      const seenQuestionIds = new Set<string>();

      for (const plannedSec of plan.sections) {
        const sectionTargetCount = isFullPattern
          ? plannedSec.questionCount
          : Math.max(1, Math.round((plannedSec.questionCount / plan.totalQuestions) * targetTotalQuestions));

        const mockSec = await prisma.mockTestSection.create({
          data: {
            mockTestId: mockTest.id,
            name: plannedSec.sectionName,
            sectionOrder: plannedSec.sectionOrder,
            questionCount: sectionTargetCount,
            marksPerQuestion: new Prisma.Decimal(plannedSec.marksPerQuestion),
            negativeRate: new Prisma.Decimal(plannedSec.negativeRate),
          },
        });

        for (const alloc of plannedSec.topicAllocations) {
          const targetTopicCount = isFullPattern
            ? alloc.questionCount
            : Math.max(1, Math.round((alloc.questionCount / plannedSec.questionCount) * sectionTargetCount));

          // 5a. Pull existing approved questions from Question Bank
          const existingQuestions = await prisma.question.findMany({
            where: {
              topicId: alloc.topicId,
              status: "APPROVED",
              deletedAt: null,
              id: { notIn: Array.from(seenQuestionIds) },
            },
            take: targetTopicCount,
            include: { options: { orderBy: { sortOrder: "asc" } } },
          });

          // Attach available existing questions
          for (const exQ of existingQuestions) {
            seenQuestionIds.add(exQ.id);
            await prisma.mockTestQuestion.create({
              data: {
                mockTestId: mockTest.id,
                mockTestSectionId: mockSec.id,
                questionId: exQ.id,
                questionOrder: overallQuestionOrder++,
                marks: new Prisma.Decimal(plannedSec.marksPerQuestion),
                negativeMarks: new Prisma.Decimal(plannedSec.negativeRate),
              },
            });
          }

          const missingForTopic = targetTopicCount - existingQuestions.length;

          // 5b. Generate remaining missing questions with AI if needed
          if (missingForTopic > 0 && generateMissingWithAi) {
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
              requestedQuestionCount: missingForTopic,
            });

            const generatedBatch = await geminiQuestionService.generateQuestions({
              examName: plan.examName,
              authority: examVersion.exam.authority,
              versionName: plan.versionName,
              sectionName: plannedSec.sectionName,
              topicName: alloc.topicName,
              questionCount: missingForTopic,
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

              seenQuestionIds.add(newQuestion.id);

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
      }

      // 6. Pattern Validation Engine Execution
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

      // 7. Mark Published and Complete
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
        action: isFullPattern ? "FULL_PATTERN_MOCK_GENERATED" : "QUICK_MOCK_GENERATED",
        resourceType: "MockTest",
        resourceId: mockTest.id,
        ipAddress: params.ip,
        userAgent: params.userAgent,
        changesDiff: {
          code: mockCode,
          sequence,
          blueprintId: plan.blueprintId,
          totalQuestions: isFullPattern ? plan.totalQuestions : targetTotalQuestions,
          totalMarks: plan.totalMarks,
          durationMinutes: targetDurationMinutes,
          is100PercentCompliant: validationReport.isValid,
          generationMode: isFullPattern ? "FULL_PATTERN" : "QUICK",
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
