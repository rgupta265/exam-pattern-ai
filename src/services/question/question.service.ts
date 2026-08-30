import { prisma } from "@/lib/prisma";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { QuestionValidationService } from "./question-validation.service";
import { geminiQuestionService } from "@/services/ai/gemini-question.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  CreateQuestionInput,
  QuestionFilterParams,
  QuestionReviewInput,
  UpdateQuestionInput,
} from "@/modules/question/schemas/question.schema";
import { Prisma, QuestionStatus, QuestionType, DifficultyLevel, QuestionSource, ReviewDecision } from "@prisma/client";

export class QuestionService {
  /**
   * Filter and search questions with server-side pagination
   */
  public static async getQuestions(params: QuestionFilterParams) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 15));
    const skip = (page - 1) * pageSize;

    const where: Prisma.QuestionWhereInput = {
      deletedAt: null,
    };

    if (params.topicId) {
      where.topicId = params.topicId;
    }

    if (params.sectionId) {
      where.topic = { sectionId: params.sectionId };
    }

    if (params.examVersionId) {
      where.topic = { section: { syllabus: { examVersionId: params.examVersionId } } };
    }

    if (params.difficulty) {
      where.difficulty = params.difficulty as DifficultyLevel;
    }

    if (params.status) {
      where.status = params.status as QuestionStatus;
    }

    if (params.source) {
      where.source = params.source as QuestionSource;
    }

    if (params.search) {
      where.questionText = { contains: params.search.trim() };
    }

    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          topic: {
            include: {
              section: {
                include: {
                  syllabus: {
                    include: { examVersion: { include: { exam: true } } },
                  },
                },
              },
            },
          },
          options: { orderBy: { sortOrder: "asc" } },
          reviews: {
            orderBy: { reviewedAt: "desc" },
            take: 1,
            include: { reviewer: { select: { fullName: true } } },
          },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  public static async getQuestionById(id: string) {
    const question = await prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: {
        topic: {
          include: {
            section: {
              include: {
                syllabus: {
                  include: { examVersion: { include: { exam: true } } },
                },
              },
            },
          },
        },
        options: { orderBy: { sortOrder: "asc" } },
        reviews: {
          orderBy: { reviewedAt: "desc" },
          include: { reviewer: { select: { id: true, fullName: true, email: true } } },
        },
        aiGenerations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!question) {
      throw new NotFoundError("Question");
    }

    return question;
  }

  /**
   * Manually create a verified question in question bank
   */
  public static async createQuestion(
    input: CreateQuestionInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.QUESTION_CREATE);

    // 1. Mandatory Syllabus Verification
    const topic = await prisma.syllabusTopic.findUnique({
      where: { id: input.topicId },
      include: { section: { include: { syllabus: true } } },
    });

    if (!topic) {
      throw new NotFoundError("Syllabus Topic");
    }

    // 2. Deterministic Validation
    const validation = QuestionValidationService.validate(input);
    if (!validation.isValid) {
      throw new ValidationError("Question validation failed", validation.errors);
    }

    // 3. Duplicate Detection within Topic
    const existing = await prisma.question.findMany({
      where: { topicId: input.topicId, deletedAt: null },
      select: { questionText: true },
    });

    if (QuestionValidationService.isDuplicate(input.questionText, existing.map((q) => q.questionText))) {
      throw new ConflictError("A duplicate question with identical text already exists in this topic.");
    }

    // 4. Create Question & Options atomically
    const question = await prisma.question.create({
      data: {
        topicId: input.topicId,
        questionType: (input.questionType as QuestionType) || "SINGLE_CHOICE",
        difficulty: (input.difficulty as DifficultyLevel) || "MEDIUM",
        status: (input.status as QuestionStatus) || "DRAFT",
        questionText: input.questionText.trim(),
        questionTextHindi: input.questionTextHindi?.trim() || null,
        explanation: input.explanation?.trim() || null,
        explanationHindi: input.explanationHindi?.trim() || null,
        subtopic: input.subtopic?.trim() || null,
        marks: new Prisma.Decimal(input.marks || 1.0),
        negativeMarks: new Prisma.Decimal(input.negativeMarks || 0.0),
        source: (input.source as QuestionSource) || "MANUAL",
        sourceReference: input.sourceReference?.trim() || null,
        isPreviousYear: input.isPreviousYear || false,
        pyqYear: input.pyqYear || null,
        isHumanVerified: input.status === "APPROVED",
        options: {
          create: input.options.map((opt, idx) => ({
            optionKey: opt.optionKey.trim().toUpperCase(),
            optionText: opt.optionText.trim(),
            optionTextHindi: opt.optionTextHindi?.trim() || null,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder || idx,
          })),
        },
      },
      include: {
        options: { orderBy: { sortOrder: "asc" } },
        topic: true,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "QUESTION_CREATE",
      resourceType: "Question",
      resourceId: question.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { created: { id: question.id, topicId: input.topicId } },
    });

    return question;
  }

  /**
   * Update question content
   */
  public static async updateQuestion(
    id: string,
    input: UpdateQuestionInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.QUESTION_UPDATE);

    const existing = await prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!existing) {
      throw new NotFoundError("Question");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.options && input.options.length > 0) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: input.options.map((opt, idx) => ({
            questionId: id,
            optionKey: opt.optionKey.trim().toUpperCase(),
            optionText: opt.optionText.trim(),
            optionTextHindi: opt.optionTextHindi?.trim() || null,
            isCorrect: opt.isCorrect,
            sortOrder: opt.sortOrder || idx,
          })),
        });
      }

      return tx.question.update({
        where: { id },
        data: {
          topicId: input.topicId || existing.topicId,
          questionType: (input.questionType as QuestionType) || existing.questionType,
          difficulty: (input.difficulty as DifficultyLevel) || existing.difficulty,
          status: (input.status as QuestionStatus) || existing.status,
          questionText: input.questionText !== undefined ? input.questionText.trim() : existing.questionText,
          questionTextHindi: input.questionTextHindi !== undefined ? input.questionTextHindi?.trim() || null : existing.questionTextHindi,
          explanation: input.explanation !== undefined ? input.explanation?.trim() || null : existing.explanation,
          explanationHindi: input.explanationHindi !== undefined ? input.explanationHindi?.trim() || null : existing.explanationHindi,
          subtopic: input.subtopic !== undefined ? input.subtopic?.trim() || null : existing.subtopic,
          marks: input.marks ? new Prisma.Decimal(input.marks) : existing.marks,
          negativeMarks: input.negativeMarks !== undefined ? new Prisma.Decimal(input.negativeMarks) : existing.negativeMarks,
          source: (input.source as QuestionSource) || existing.source,
          sourceReference: input.sourceReference !== undefined ? input.sourceReference?.trim() || null : existing.sourceReference,
          isPreviousYear: input.isPreviousYear !== undefined ? input.isPreviousYear : existing.isPreviousYear,
          pyqYear: input.pyqYear !== undefined ? input.pyqYear : existing.pyqYear,
        },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
          topic: true,
        },
      });
    });

    await AuditService.log({
      userId: user.id,
      action: "QUESTION_UPDATE",
      resourceType: "Question",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { updated: input },
    });

    return updated;
  }

  /**
   * Submit reviewer decision (Approve / Reject / Needs Revision)
   */
  public static async createReview(
    questionId: string,
    input: QuestionReviewInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.QUESTION_REVIEW);

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundError("Question");
    }

    const newStatus: QuestionStatus =
      input.decision === "APPROVED"
        ? "APPROVED"
        : input.decision === "REJECTED"
        ? "REJECTED"
        : "PENDING_REVIEW";

    const [review, updatedQuestion] = await prisma.$transaction([
      prisma.questionReview.create({
        data: {
          questionId,
          reviewerId: user.id,
          decision: input.decision as ReviewDecision,
          feedback: input.feedback?.trim() || null,
        },
      }),
      prisma.question.update({
        where: { id: questionId },
        data: {
          status: newStatus,
          isHumanVerified: input.decision === "APPROVED",
        },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
          topic: true,
        },
      }),
    ]);

    await AuditService.log({
      userId: user.id,
      action: "QUESTION_REVIEW",
      resourceType: "Question",
      resourceId: questionId,
      ipAddress: ip,
      userAgent,
      changesDiff: { decision: input.decision, newStatus },
    });

    return { review, question: updatedQuestion };
  }

  /**
   * Generate AI questions bounded strictly by verified Syllabus Topics (Single or Multi-Topic)
   */
  public static async generateQuestionsForTopic(params: {
    examVersionId: string;
    topicId?: string;
    topicIds?: string[];
    count: number;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    language?: "English" | "Hindi";
    user: SessionUser;
    ip?: string;
    userAgent?: string;
  }) {
    RbacService.requirePermission(params.user, PERMISSIONS.QUESTION_CREATE);

    // Normalize topic IDs list
    const rawIds = params.topicIds && params.topicIds.length > 0
      ? params.topicIds
      : params.topicId ? [params.topicId] : [];

    if (rawIds.length === 0) {
      throw new ValidationError("At least one valid syllabus topic must be selected.");
    }

    // 1. Mandatory Server-Side Syllabus Verification
    const verifiedTopics = await prisma.syllabusTopic.findMany({
      where: { id: { in: rawIds } },
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

    if (verifiedTopics.length !== rawIds.length) {
      throw new ValidationError("One or more requested syllabus topics could not be found.");
    }

    // Ensure all topics belong to the selected exam version and have verified syllabus
    for (const t of verifiedTopics) {
      if (t.section.syllabus.examVersionId !== params.examVersionId) {
        throw new ValidationError(
          `Topic '${t.name}' does not belong to the verified syllabus of the selected exam version.`
        );
      }
    }

    const firstTopic = verifiedTopics[0];
    const examVersion = firstTopic.section.syllabus.examVersion;
    const blueprint = examVersion.blueprints[0];

    const totalRequestedCount = Math.min(Math.max(1, params.count || 5), 50);
    const createdQuestions = [];
    const questionsPerTopic = Math.max(1, Math.ceil(totalRequestedCount / verifiedTopics.length));

    for (const topic of verifiedTopics) {
      if (createdQuestions.length >= totalRequestedCount) break;
      const countForThisTopic = Math.min(
        questionsPerTopic,
        totalRequestedCount - createdQuestions.length
      );

      // 2. Invoke Gemini AI Question Generation bounded to this verified topic
      const batch = await geminiQuestionService.generateQuestions({
        examName: examVersion.exam.name,
        authority: examVersion.exam.authority,
        versionName: examVersion.versionName,
        sectionName: topic.section.name,
        topicName: topic.name,
        questionCount: countForThisTopic,
        difficulty: params.difficulty || "MEDIUM",
        language: params.language || "English",
        marksPerQuestion: 1.0,
        negativeRate: blueprint ? Number(blueprint.negativeMarkingRate) : 0.25,
        specialInstructions: blueprint?.instructions || null,
      });

      // 3. Deterministic Validation & Duplicate Filtering
      const existingQuestions = await prisma.question.findMany({
        where: { topicId: topic.id, deletedAt: null },
        select: { questionText: true },
      });
      const existingTexts = existingQuestions.map((q) => q.questionText);

      for (const item of batch.questions) {
        if (createdQuestions.length >= totalRequestedCount) break;

        const formattedInput: CreateQuestionInput = {
          topicId: topic.id,
          questionType: "SINGLE_CHOICE",
          difficulty: item.difficulty,
          status: "AI_GENERATED",
          questionText: item.questionText,
          questionTextHindi: item.questionTextHindi || null,
          explanation: item.explanation,
          explanationHindi: item.explanationHindi || null,
          subtopic: item.subtopic || null,
          marks: item.marks || 1.0,
          negativeMarks: item.negativeMarks || 0.25,
          source: "AI_GENERATED",
          options: item.options.map((opt, idx) => ({
            optionKey: opt.key,
            optionText: opt.text,
            optionTextHindi: opt.textHindi || null,
            isCorrect: opt.isCorrect || opt.key === item.correctAnswer,
            sortOrder: idx,
          })),
        };

        const validation = QuestionValidationService.validate(formattedInput);
        if (!validation.isValid) continue;

        if (QuestionValidationService.isDuplicate(item.questionText, existingTexts)) continue;

        // Save question and AI generation log
        const created = await prisma.question.create({
          data: {
            topicId: topic.id,
            questionType: "SINGLE_CHOICE",
            difficulty: item.difficulty as DifficultyLevel,
            status: "AI_GENERATED",
            questionText: item.questionText.trim(),
            questionTextHindi: item.questionTextHindi?.trim() || null,
            explanation: item.explanation.trim(),
            explanationHindi: item.explanationHindi?.trim() || null,
            subtopic: item.subtopic?.trim() || null,
            marks: new Prisma.Decimal(item.marks || 1.0),
            negativeMarks: new Prisma.Decimal(item.negativeMarks || 0.25),
            source: "AI_GENERATED",
            isAiGenerated: true,
            isAiValidated: true,
            options: {
              create: formattedInput.options.map((opt, idx) => ({
                optionKey: opt.optionKey,
                optionText: opt.optionText,
                optionTextHindi: opt.optionTextHindi || null,
                isCorrect: opt.isCorrect,
                sortOrder: idx,
              })),
            },
            aiGenerations: {
              create: {
                promptUsed: `Topic: ${topic.name} | Difficulty: ${params.difficulty || "MEDIUM"}`,
                modelName: "gemini-2.0-flash",
                rawResponse: item as unknown as Prisma.InputJsonValue,
                validationStatus: "PASSED",
              },
            },
          },
          include: { options: true },
        });

        existingTexts.push(item.questionText);
        createdQuestions.push(created);
      }
    }

    await AuditService.log({
      userId: params.user.id,
      action: "QUESTION_AI_GENERATE_BATCH",
      resourceType: "SyllabusTopic",
      resourceId: firstTopic.id,
      ipAddress: params.ip,
      userAgent: params.userAgent,
      changesDiff: {
        countGenerated: createdQuestions.length,
        selectedTopicIds: rawIds,
        examVersionId: params.examVersionId,
      },
    });

    return {
      generatedCount: createdQuestions.length,
      questions: createdQuestions,
    };
  }
}
