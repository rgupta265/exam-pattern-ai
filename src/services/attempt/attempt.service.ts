import { prisma } from "@/lib/prisma";
import { ScoreCalculationService } from "@/services/result/score-calculation.service";
import { AuditService } from "@/services/audit/audit.service";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { AutosaveAnswerInput } from "@/modules/attempt/schemas/attempt.schema";
import { Prisma } from "@prisma/client";

export class AttemptService {
  /**
   * Start a new test attempt or resume an existing active attempt idempotently.
   * Supports multiple retakes with attempt limits and concurrency safety.
   */
  public static async createAttempt(
    mockTestId: string,
    candidateId: string,
    ip?: string,
    userAgent?: string
  ) {
    if (!mockTestId || typeof mockTestId !== "string") {
      throw new BadRequestError("Valid mock test identifier is required.");
    }

    // Flexible identifier resolution: match by primary UUID, unique public code, or slug
    const mock = await prisma.mockTest.findFirst({
      where: {
        OR: [
          { id: mockTestId },
          { code: mockTestId },
          { slug: mockTestId },
        ],
        deletedAt: null,
      },
      include: {
        examVersion: { include: { exam: true } },
        sections: {
          orderBy: { sectionOrder: "asc" },
          include: {
            questions: {
              orderBy: { questionOrder: "asc" },
            },
          },
        },
      },
    });

    if (!mock) {
      console.warn(`[AttemptService] Mock not found for identifier: ${mockTestId}`);
      throw new NotFoundError("Mock test could not be found.");
    }

    if (mock.status !== "PUBLISHED") {
      console.warn(`[AttemptService] Attempt blocked: Mock ${mock.code || mock.id} status is ${mock.status}`);
      throw new BadRequestError(`This mock test is currently not available for attempts (Status: ${mock.status}).`);
    }

    const resolvedMockId = mock.id;

    // Check for existing active attempt (Idempotency & Session Resume)
    const activeAttempt = await prisma.testAttempt.findFirst({
      where: {
        candidateId,
        mockTestId: resolvedMockId,
        status: "IN_PROGRESS",
      },
    });

    if (activeAttempt) {
      const durationSeconds = mock.durationMinutes * 60;
      const elapsedSeconds = Math.floor(
        (Date.now() - activeAttempt.startedAt.getTime()) / 1000
      );

      // If already expired, finalize it
      if (elapsedSeconds >= durationSeconds) {
        await this.submitAttempt(activeAttempt.id, candidateId, true);
      } else {
        return activeAttempt; // Resume existing active attempt safely
      }
    }

    // Collect all question IDs in the mock test
    const allQuestions = mock.sections.flatMap((s) => s.questions);
    if (allQuestions.length === 0) {
      console.warn(`[AttemptService] Mock ${mock.code || mock.id} has 0 questions configured.`);
      throw new BadRequestError("This mock test does not contain any questions yet.");
    }

    // Concurrency-safe atomic attempt creation & retake validation
    const attempt = await prisma.$transaction(async (tx) => {
      // Re-verify in-progress inside transaction
      const ongoing = await tx.testAttempt.findFirst({
        where: {
          candidateId,
          mockTestId: resolvedMockId,
          status: "IN_PROGRESS",
        },
      });

      if (ongoing) {
        return ongoing;
      }

      // Check completed attempts
      const priorCount = await tx.testAttempt.count({
        where: {
          candidateId,
          mockTestId: resolvedMockId,
          status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
        },
      });

      const maxAttempts = 10; // Standard configurable limit
      if (priorCount >= maxAttempts) {
        throw new BadRequestError(`Maximum attempt limit of ${maxAttempts} has been reached for this examination.`);
      }

      const nextAttemptNumber = priorCount + 1;

      const newAttempt = await tx.testAttempt.create({
        data: {
          candidateId,
          mockTestId: resolvedMockId,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          ipAddress: ip || null,
          userAgent: userAgent || null,
        },
      });

      // Pre-populate TestAnswer rows for all questions in the mock test
      await tx.testAnswer.createMany({
        data: allQuestions.map((mq) => ({
          attemptId: newAttempt.id,
          questionId: mq.questionId,
          isVisited: false,
          isAnswered: false,
          isMarkedForReview: false,
          timeSpentSeconds: 0,
        })),
      });

      // Record Start Event with Snapshot info
      await tx.attemptEvent.create({
        data: {
          attemptId: newAttempt.id,
          eventType: "START",
          eventData: {
            mockTitle: mock.title,
            attemptNumber: nextAttemptNumber,
            totalQuestions: mock.totalQuestions,
            durationMinutes: mock.durationMinutes,
            totalMarks: Number(mock.totalMarks),
            negativeRate: Number(mock.negativeRate),
          },
          timeOffsetMs: 0,
        },
      });

      return newAttempt;
    });

    await AuditService.log({
      userId: candidateId,
      action: "ATTEMPT_START",
      resourceType: "TestAttempt",
      resourceId: attempt.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { mockTestId: resolvedMockId, startedAt: attempt.startedAt },
    });

    return attempt;
  }

  /**
   * Get all attempts for a candidate on a specific mock test
   */
  public static async getCandidateAttemptsForMock(mockTestId: string, candidateId: string) {
    const attempts = await prisma.testAttempt.findMany({
      where: {
        mockTestId,
        candidateId,
      },
      orderBy: { startedAt: "desc" },
      include: {
        testResult: true,
      },
    });

    return attempts.map((a, index) => {
      const attemptNumber = attempts.length - index;
      return {
        id: a.id,
        attemptNumber,
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        totalTimeSpentSeconds: a.totalTimeSpentSeconds,
        result: a.testResult
          ? {
              id: a.testResult.id,
              netScore: Number(a.testResult.netScore),
              totalMarks: Number(a.testResult.totalMarks),
              percentage: Number(a.testResult.percentage),
              accuracyRate: Number(a.testResult.accuracyRate),
              correctAnswers: a.testResult.correctAnswers,
              incorrectAnswers: a.testResult.incorrectAnswers,
              unansweredCount: a.testResult.unattemptedQuestions,
            }
          : null,
      };
    });
  }

  /**
   * Get mock attempts summary for candidate dashboard and cards
   */
  public static async getMockAttemptsSummary(mockTestId: string, candidateId: string) {
    const attempts = await prisma.testAttempt.findMany({
      where: {
        mockTestId,
        candidateId,
        status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
      },
      orderBy: { startedAt: "desc" },
      include: {
        testResult: true,
      },
    });

    const scores = attempts
      .map((a) => (a.testResult ? Number(a.testResult.percentage) : null))
      .filter((s): s is number => s !== null);

    const bestScore = scores.length > 0 ? Math.max(...scores) : null;
    const latestScore = scores.length > 0 ? scores[0] : null;
    const averageScore =
      scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

    const maxAttempts = 10;
    const canRetake = attempts.length < maxAttempts;

    return {
      attemptCount: attempts.length,
      bestScore,
      latestScore,
      averageScore,
      maxAttempts,
      canRetake,
    };
  }

  /**
   * Record candidate instructions acknowledgement and language preference
   */
  public static async acknowledgeInstructions(
    attemptId: string,
    candidateId: string,
    language = "BILINGUAL"
  ) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) throw new NotFoundError("Test Attempt");
    if (attempt.candidateId !== candidateId) throw new ForbiddenError("Unauthorized attempt access.");

    return await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        instructionsAcknowledgedAt: new Date(),
        instructionsLanguage: language,
        attemptLanguage: language,
      },
    });
  }

  /**
   * Fetch attempt details for candidate exam interface with server-side timer validation.
   * SECURITY: Strips all isCorrect and correct answer keys from question options.
   */
  public static async getAttemptForExam(
    attemptId: string,
    candidateId: string,
    isAdmin = false
  ) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          include: {
            examVersion: { include: { exam: true } },
            sections: {
              orderBy: { sectionOrder: "asc" },
              include: {
                questions: {
                  orderBy: { questionOrder: "asc" },
                  include: {
                    question: {
                      select: {
                        id: true,
                        questionText: true,
                        questionTextHindi: true,
                        questionType: true,
                        difficulty: true,
                        options: {
                          select: {
                            id: true,
                            optionKey: true,
                            optionText: true,
                            optionTextHindi: true,
                            sortOrder: true,
                            // NEVER select isCorrect during live exam
                          },
                          orderBy: { sortOrder: "asc" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        answers: true,
        testResult: {
          select: { id: true },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Test Attempt");
    }

    if (!isAdmin && attempt.candidateId !== candidateId) {
      throw new ForbiddenError("You are not authorized to access this exam attempt.");
    }

    const mock = attempt.mockTest;
    const durationSeconds = mock.durationMinutes * 60;
    const elapsedSeconds = Math.floor(
      (Date.now() - attempt.startedAt.getTime()) / 1000
    );
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    // Server-Authoritative Timer Check: Auto-submit on timer expiry
    if (remainingSeconds <= 0 && attempt.status === "IN_PROGRESS") {
      const result = await this.submitAttempt(attemptId, candidateId, true, isAdmin);
      return {
        attempt: { ...attempt, status: "AUTO_SUBMITTED" as const },
        mockTest: attempt.mockTest,
        remainingSeconds: 0,
        isExpired: true,
        resultId: result.id,
      };
    }

    return {
      attempt,
      mockTest: attempt.mockTest,
      remainingSeconds,
      isExpired: remainingSeconds <= 0,
      resultId: attempt.testResult?.id || null,
    };
  }

  /**
   * Autosave candidate answer and record interaction event
   */
  public static async saveAnswer(
    attemptId: string,
    input: AutosaveAnswerInput,
    candidateId: string,
    _ip?: string,
    _userAgent?: string
  ) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: true },
    });

    if (!attempt) throw new NotFoundError("Test Attempt");
    if (attempt.candidateId !== candidateId) throw new ForbiddenError("Unauthorized attempt access.");

    if (attempt.status !== "IN_PROGRESS") {
      throw new BadRequestError("Cannot submit answer: Attempt is already submitted or closed.");
    }

    // Check expiration
    const durationSeconds = attempt.mockTest.durationMinutes * 60;
    const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    if (elapsedSeconds >= durationSeconds) {
      await this.submitAttempt(attemptId, candidateId, true);
      throw new BadRequestError("Exam duration has expired. Test has been auto-submitted.");
    }

    const existingAnswer = await prisma.testAnswer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: input.questionId,
        },
      },
    });

    let eventType = "SELECT_ANSWER";
    if (existingAnswer) {
      if (existingAnswer.selectedOptionId && !input.selectedOptionId) {
        eventType = "CLEAR_ANSWER";
      } else if (
        existingAnswer.selectedOptionId &&
        input.selectedOptionId &&
        existingAnswer.selectedOptionId !== input.selectedOptionId
      ) {
        eventType = "CHANGE_ANSWER";
      } else if (
        input.isMarkedForReview !== undefined &&
        input.isMarkedForReview !== existingAnswer.isMarkedForReview
      ) {
        eventType = input.isMarkedForReview ? "MARK_REVIEW" : "UNMARK_REVIEW";
      }
    }

    const isAnswered = Boolean(input.selectedOptionId || input.numericalAnswer !== undefined);
    const addedTime = input.timeSpentSeconds || 0;

    const [updatedAnswer] = await prisma.$transaction([
      prisma.testAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: input.questionId,
          },
        },
        update: {
          selectedOptionId: input.selectedOptionId !== undefined ? input.selectedOptionId : existingAnswer?.selectedOptionId,
          numericalAnswer: input.numericalAnswer !== undefined ? (input.numericalAnswer !== null ? new Prisma.Decimal(input.numericalAnswer) : null) : existingAnswer?.numericalAnswer,
          isMarkedForReview: input.isMarkedForReview !== undefined ? input.isMarkedForReview : existingAnswer?.isMarkedForReview,
          isVisited: true,
          isAnswered: input.selectedOptionId ? true : input.selectedOptionId === null ? false : existingAnswer?.isAnswered,
          timeSpentSeconds: { increment: addedTime },
          changeCount: { increment: 1 },
        },
        create: {
          attemptId,
          questionId: input.questionId,
          selectedOptionId: input.selectedOptionId || null,
          numericalAnswer: input.numericalAnswer !== undefined && input.numericalAnswer !== null ? new Prisma.Decimal(input.numericalAnswer) : null,
          isMarkedForReview: input.isMarkedForReview || false,
          isVisited: true,
          isAnswered,
          timeSpentSeconds: addedTime,
          changeCount: 1,
        },
      }),
      prisma.answerEvent.create({
        data: {
          attemptId,
          questionId: input.questionId,
          eventType,
          previousValue: existingAnswer?.selectedOptionId ? { selectedOptionId: existingAnswer.selectedOptionId } : Prisma.JsonNull,
          newValue: input.selectedOptionId ? { selectedOptionId: input.selectedOptionId } : Prisma.JsonNull,
          timeOffsetMs: elapsedSeconds * 1000,
        },
      }),
      prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          lastHeartbeatAt: new Date(),
          totalTimeSpentSeconds: { increment: addedTime },
        },
      }),
    ]);

    return updatedAnswer;
  }

  /**
   * Log attempt-level navigation and state events
   */
  public static async recordEvent(
    attemptId: string,
    eventType: string,
    eventData: Record<string, unknown> | null,
    candidateId: string
  ) {
    const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.candidateId !== candidateId) return;

    const elapsedMs = Date.now() - attempt.startedAt.getTime();

    return prisma.attemptEvent.create({
      data: {
        attemptId,
        eventType,
        eventData: eventData as unknown as Prisma.InputJsonValue,
        timeOffsetMs: Math.max(0, elapsedMs),
      },
    });
  }

  /**
   * Final submission and score calculation
   */
  public static async submitAttempt(
    attemptId: string,
    candidateId: string,
    isAutoSubmit = false,
    isAdmin = false
  ) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        testResult: true,
      },
    });

    if (!attempt) throw new NotFoundError("Test Attempt");
    if (!isAdmin && attempt.candidateId !== candidateId) throw new ForbiddenError("Unauthorized submit request.");

    // Idempotency: If already evaluated and submitted, return existing result
    if (attempt.testResult) {
      return attempt.testResult;
    }

    const newStatus = isAutoSubmit ? "AUTO_SUBMITTED" : "SUBMITTED";

    // Lock attempt
    await prisma.$transaction([
      prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: newStatus,
          submittedAt: new Date(),
        },
      }),
      prisma.attemptEvent.create({
        data: {
          attemptId,
          eventType: isAutoSubmit ? "AUTO_SUBMIT" : "SUBMIT",
          eventData: { isAutoSubmit },
          timeOffsetMs: Date.now() - attempt.startedAt.getTime(),
        },
      }),
    ]);

    // Calculate marks and generate scorecard
    const result = await ScoreCalculationService.calculateAndPersistResult(attemptId);

    await AuditService.log({
      userId: candidateId,
      action: isAutoSubmit ? "ATTEMPT_AUTO_SUBMIT" : "ATTEMPT_SUBMIT",
      resourceType: "TestAttempt",
      resourceId: attemptId,
      changesDiff: { resultId: result.id, netScore: result.netScore },
    });

    return result;
  }
}
