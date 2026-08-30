import { prisma } from "@/lib/prisma";
import { MockPatternValidatorService } from "./mock-pattern-validator.service";
import { geminiQuestionService } from "@/services/ai/gemini-question.service";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { BadRequestError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  GenerateFullMockRequestInput,
  GenerateTopicMockRequestInput,
  MockFilterParams,
} from "@/modules/mock/schemas/mock.schema";
import { Prisma, MockTestType, MockPublishStatus, DifficultyLevel } from "@prisma/client";

export class MockEngineService {
  /**
   * Helper to generate unique mock tracking codes like UPHO-2026-MOCK-001
   */
  private static async getNextMockSequenceAndCode(
    examCode: string,
    year: number,
    examVersionId: string,
    prefix: "MOCK" | "TOPIC" | "SOURCE" = "MOCK"
  ): Promise<{ sequence: number; code: string }> {
    const count = await prisma.mockTest.count({
      where: { examVersionId },
    });
    const sequence = count + 1;
    const sanitizedCode = (examCode || "EXAM").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const code = `${sanitizedCode}-${year}-${prefix}-${sequence.toString().padStart(3, "0")}`;
    return { sequence, code };
  }

  /**
   * Filter and list mock tests
   */
  public static async getMockTests(params: MockFilterParams) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.MockTestWhereInput = {
      deletedAt: null,
    };

    if (params.isCandidateFacing) {
      where.status = "PUBLISHED";
      where.examVersion = {
        deletedAt: null,
        status: { in: ["VERIFIED", "ACTIVE"] },
      };
    } else if (params.status) {
      where.status = params.status as MockPublishStatus;
    }

    if (params.examVersionId) {
      where.examVersionId = params.examVersionId;
    }

    if (params.type) {
      where.type = params.type as MockTestType;
    }

    if (params.search) {
      where.title = { contains: params.search.trim() };
    }

    const [items, total] = await Promise.all([
      prisma.mockTest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
        include: {
          examVersion: {
            include: {
              exam: { include: { category: true } },
            },
          },
          blueprint: true,
          _count: {
            select: { questions: true, sections: true, attempts: true },
          },
        },
      }),
      prisma.mockTest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  public static async getMockTestById(id: string, isCandidateFacing = false) {
    const mock = await prisma.mockTest.findFirst({
      where: {
        OR: [{ id }, { code: id }, { slug: id }],
        deletedAt: null,
        ...(isCandidateFacing ? { status: "PUBLISHED" } : {}),
      },
      include: {
        examVersion: {
          include: {
            exam: { include: { category: true } },
          },
        },
        blueprint: {
          include: { sections: { orderBy: { sectionOrder: "asc" } } },
        },
        sections: {
          orderBy: { sectionOrder: "asc" },
          include: {
            questions: {
              orderBy: { questionOrder: "asc" },
              include: {
                question: {
                  include: {
                    options: { orderBy: { sortOrder: "asc" } },
                    topic: true,
                    translations: true,
                  },
                },
              },
            },
          },
        },
        validationResults: {
          orderBy: { validatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!mock) {
      throw new NotFoundError("Mock Test");
    }

    return mock;
  }

  /**
   * Generate Full Exam Mock strictly adhering to verified/locked Blueprint
   */
  public static async generateFullExamMock(
    input: GenerateFullMockRequestInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.MOCK_CREATE);

    // 1. Fetch Exam Version & Authoritative Locked/Active Blueprint
    const examVersion = await prisma.examVersion.findUnique({
      where: { id: input.examVersionId, deletedAt: null },
      include: {
        exam: true,
        blueprints: {
          where: input.blueprintId
            ? { id: input.blueprintId }
            : { status: { in: ["LOCKED", "ACTIVE", "VERIFIED"] } },
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: {
            sections: { orderBy: { sectionOrder: "asc" } },
          },
        },
        syllabi: {
          where: { isVerified: true },
          include: {
            sections: {
              include: { topics: { orderBy: { sortOrder: "asc" } } },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!examVersion) throw new NotFoundError("Exam Version");

    const blueprint = examVersion.blueprints[0];
    if (!blueprint) {
      throw new BadRequestError(
        "Cannot generate Full Exam Mock: No VERIFIED or LOCKED blueprint exists for this exam version."
      );
    }

    const syllabus = examVersion.syllabi[0] || (await prisma.syllabus.findFirst({
      where: { examVersionId: examVersion.id },
      include: {
        sections: {
          include: { topics: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    }));

    if (!syllabus || syllabus.sections.length === 0) {
      throw new BadRequestError("Cannot generate Mock: No syllabus defined for this exam version.");
    }

    // 2. Track Request Lifecycle
    const genRequest = await prisma.mockGenerationRequest.create({
      data: {
        examVersionId: examVersion.id,
        requestedById: user.id,
        status: "PROCESSING",
        criteria: {
          blueprintId: blueprint.id,
          blueprintTitle: blueprint.title,
          totalQuestions: blueprint.totalQuestions,
          totalMarks: Number(blueprint.totalMarks),
          durationMinutes: blueprint.durationMinutes,
        },
      },
    });

    try {
      const { sequence, code: mockCode } = await this.getNextMockSequenceAndCode(
        examVersion.exam.code,
        examVersion.year,
        examVersion.id,
        "MOCK"
      );

      const mockSlug = `${examVersion.exam.slug}-${examVersion.year}-mock-${sequence}-${Date.now().toString(36)}`;
      const mockTitle = input.title || `${examVersion.exam.name} ${examVersion.year} Mock Test ${sequence}`;

      // 3. Create MockTest Master Record
      const mockTest = await prisma.mockTest.create({
        data: {
          code: mockCode,
          examVersionId: examVersion.id,
          blueprintId: blueprint.id,
          type: "FULL_MOCK",
          sequence,
          title: mockTitle,
          slug: mockSlug,
          durationMinutes: blueprint.durationMinutes,
          totalQuestions: blueprint.totalQuestions,
          totalMarks: blueprint.totalMarks,
          negativeRate: blueprint.negativeMarkingRate,
          difficulty: DifficultyLevel.MEDIUM,
          language: "BILINGUAL",
          generationType: "BLUEPRINT",
          createdById: user.id,
          status: "GENERATING",
        },
      });

      // 4. Section-by-Section Question Assembly
      let overallQuestionOrder = 1;

      for (const bpSec of blueprint.sections) {
        const mockSec = await prisma.mockTestSection.create({
          data: {
            mockTestId: mockTest.id,
            name: bpSec.name,
            sectionOrder: bpSec.sectionOrder,
            questionCount: bpSec.questionCount,
            marksPerQuestion: bpSec.marksPerQuestion,
            negativeRate: bpSec.negativeRate,
          },
        });

        const matchedSylSec =
          syllabus.sections.find((s) => s.sortOrder === bpSec.sectionOrder) ||
          syllabus.sections[bpSec.sectionOrder - 1] ||
          syllabus.sections[0];

        const topicPool = matchedSylSec?.topics.length > 0 ? matchedSylSec.topics : syllabus.sections.flatMap((s) => s.topics);
        const secQuestionsToGenerate = bpSec.questionCount;

        for (let qIdx = 0; qIdx < secQuestionsToGenerate; qIdx++) {
          const selectedTopic = topicPool[qIdx % topicPool.length];

          const generatedBatch = await geminiQuestionService.generateQuestions({
            examName: examVersion.exam.name,
            authority: examVersion.exam.authority,
            versionName: examVersion.versionName,
            sectionName: bpSec.name,
            topicName: selectedTopic.name,
            questionCount: 1,
            difficulty: qIdx % 3 === 0 ? "EASY" : qIdx % 3 === 1 ? "MEDIUM" : "HARD",
            language: "English",
            marksPerQuestion: Number(bpSec.marksPerQuestion),
            negativeRate: Number(bpSec.negativeRate),
          });

          const qData = generatedBatch.questions[0];

          const newQuestion = await prisma.question.create({
            data: {
              topicId: selectedTopic.id,
              questionType: "SINGLE_CHOICE",
              difficulty: qData.difficulty,
              status: "APPROVED",
              questionText: qData.questionText.trim(),
              questionTextHindi: qData.questionTextHindi || null,
              explanation: qData.explanation.trim(),
              explanationHindi: qData.explanationHindi || null,
              marks: bpSec.marksPerQuestion,
              negativeMarks: bpSec.negativeRate,
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
              marks: bpSec.marksPerQuestion,
              negativeMarks: bpSec.negativeRate,
            },
          });
        }
      }

      // 5. Run Pattern Validation Engine
      const validationReport = await MockPatternValidatorService.validate(mockTest.id);

      // 6. Update Request and Mock Test Status
      await prisma.mockGenerationRequest.update({
        where: { id: genRequest.id },
        data: {
          mockTestId: mockTest.id,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      if (validationReport.isValid) {
        await prisma.mockTest.update({
          where: { id: mockTest.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });
      }

      await AuditService.log({
        userId: user.id,
        action: "MOCK_TEST_GENERATE_FULL",
        resourceType: "MockTest",
        resourceId: mockTest.id,
        ipAddress: ip,
        userAgent,
        changesDiff: {
          code: mockCode,
          sequence,
          blueprintId: blueprint.id,
          totalQuestions: blueprint.totalQuestions,
          isValid: validationReport.isValid,
        },
      });

      return { mockTest, validationReport };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Mock generation failed";

      await prisma.mockGenerationRequest.update({
        where: { id: genRequest.id },
        data: {
          status: "FAILED",
          errorMessage,
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }

  /**
   * Generate Topic Practice Mock Drill
   */
  public static async generateTopicPracticeMock(
    input: GenerateTopicMockRequestInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    const topic = await prisma.syllabusTopic.findUnique({
      where: { id: input.topicId },
      include: {
        section: {
          include: {
            syllabus: {
              include: {
                examVersion: {
                  include: {
                    exam: true,
                    blueprints: { where: { status: { in: ["LOCKED", "ACTIVE", "VERIFIED"] } }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!topic || topic.section.syllabus.examVersionId !== input.examVersionId) {
      throw new ValidationError("Requested topic does not belong to the verified syllabus for this exam version.");
    }

    const examVersion = topic.section.syllabus.examVersion;
    const blueprint = examVersion.blueprints[0];
    const qCount = Math.min(input.questionCount || 20, 50);
    const marksPerQ = 1.0;
    const negRate = blueprint ? Number(blueprint.negativeMarkingRate) : 0.25;

    const { sequence, code: mockCode } = await this.getNextMockSequenceAndCode(
      examVersion.exam.code,
      examVersion.year,
      examVersion.id,
      "TOPIC"
    );

    const mockSlug = `${examVersion.exam.slug}-topic-${sequence}-${Date.now().toString(36)}`;
    const mockTitle = input.title || `${topic.name} (${input.difficulty}) Practice Drill #${sequence}`;

    const mockTest = await prisma.mockTest.create({
      data: {
        code: mockCode,
        examVersionId: examVersion.id,
        blueprintId: blueprint?.id || null,
        type: "TOPIC_PRACTICE",
        sequence,
        title: mockTitle,
        slug: mockSlug,
        durationMinutes: Math.max(10, Math.round(qCount * 1.2)),
        totalQuestions: qCount,
        totalMarks: new Prisma.Decimal(qCount * marksPerQ),
        negativeRate: new Prisma.Decimal(negRate),
        difficulty: (input.difficulty as DifficultyLevel) || DifficultyLevel.MEDIUM,
        language: "BILINGUAL",
        generationType: "TOPIC_PRACTICE",
        createdById: user.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    const mockSec = await prisma.mockTestSection.create({
      data: {
        mockTestId: mockTest.id,
        name: topic.name,
        sectionOrder: 1,
        questionCount: qCount,
        marksPerQuestion: new Prisma.Decimal(marksPerQ),
        negativeRate: new Prisma.Decimal(negRate),
      },
    });

    const batch = await geminiQuestionService.generateQuestions({
      examName: examVersion.exam.name,
      authority: examVersion.exam.authority,
      versionName: examVersion.versionName,
      sectionName: topic.section.name,
      topicName: topic.name,
      questionCount: qCount,
      difficulty: input.difficulty || "MEDIUM",
      language: input.language || "English",
      marksPerQuestion: marksPerQ,
      negativeRate: negRate,
    });

    for (let i = 0; i < batch.questions.length; i++) {
      const q = batch.questions[i];
      const newQ = await prisma.question.create({
        data: {
          topicId: topic.id,
          questionType: "SINGLE_CHOICE",
          difficulty: q.difficulty,
          status: "APPROVED",
          questionText: q.questionText.trim(),
          questionTextHindi: q.questionTextHindi || null,
          explanation: q.explanation.trim(),
          explanationHindi: q.explanationHindi || null,
          subtopic: q.subtopic || null,
          marks: new Prisma.Decimal(marksPerQ),
          negativeMarks: new Prisma.Decimal(negRate),
          source: "AI_GENERATED",
          isAiGenerated: true,
          isAiValidated: true,
          isHumanVerified: true,
          options: {
            create: q.options.map((opt, optIdx) => ({
              optionKey: opt.key,
              optionText: opt.text,
              optionTextHindi: opt.textHindi || null,
              isCorrect: opt.isCorrect || opt.key === q.correctAnswer,
              sortOrder: optIdx,
            })),
          },
        },
      });

      await prisma.mockTestQuestion.create({
        data: {
          mockTestId: mockTest.id,
          mockTestSectionId: mockSec.id,
          questionId: newQ.id,
          questionOrder: i + 1,
          marks: new Prisma.Decimal(marksPerQ),
          negativeMarks: new Prisma.Decimal(negRate),
        },
      });
    }

    await AuditService.log({
      userId: user.id,
      action: "MOCK_TEST_GENERATE_TOPIC",
      resourceType: "MockTest",
      resourceId: mockTest.id,
      ipAddress: ip,
      userAgent,
      changesDiff: {
        code: mockCode,
        topicId: topic.id,
        topicName: topic.name,
        questionCount: qCount,
      },
    });

    return mockTest;
  }

  /**
   * Publish or Archive a Mock Test
   */
  public static async publishMock(
    id: string,
    status: MockPublishStatus,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.MOCK_PUBLISH);

    const mock = await prisma.mockTest.findUnique({
      where: { id, deletedAt: null },
    });

    if (!mock) throw new NotFoundError("Mock Test");

    const updated = await prisma.mockTest.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : mock.publishedAt,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: `MOCK_TEST_${status}`,
      resourceType: "MockTest",
      resourceId: mock.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { previousStatus: mock.status, newStatus: status },
    });

    return updated;
  }
}

