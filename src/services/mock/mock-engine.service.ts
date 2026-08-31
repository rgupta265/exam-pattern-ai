import { prisma } from "@/lib/prisma";
import { geminiQuestionService } from "@/services/ai/gemini-question.service";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
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
    const { ActualPatternGeneratorService } = await import("./actual-pattern-generator.service");
    return ActualPatternGeneratorService.generateActualPatternMock({
      examVersionId: input.examVersionId,
      blueprintId: input.blueprintId,
      customTitle: input.title,
      generationMode: input.generationMode || "FULL_PATTERN",
      generateMissingWithAi: input.generateMissingWithAi !== false,
      quickQuestionCount: input.quickQuestionCount,
      user,
      ip,
      userAgent,
    });
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

