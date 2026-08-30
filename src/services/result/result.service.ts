import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { QuestionReviewFilterParams, ResultFilterParams } from "@/modules/result/schemas/result.schema";
import { Prisma } from "@prisma/client";

export class ResultService {
  /**
   * Fetch Result Summary by ID with Candidate Data Isolation
   */
  public static async getResultById(
    resultId: string,
    candidateId: string,
    isAdmin = false
  ) {
    const result = await prisma.testResult.findFirst({
      where: {
        OR: [
          { id: resultId },
          { attemptId: resultId },
        ],
      },
      include: {
        attempt: {
          include: {
            candidate: { select: { id: true, fullName: true, email: true } },
            mockTest: {
              include: {
                examVersion: { include: { exam: { include: { category: true } } } },
              },
            },
          },
        },
        sectionResults: {
          orderBy: { createdAt: "asc" },
        },
        topicResults: {
          orderBy: { accuracy: "desc" },
        },
      },
    });

    if (!result) {
      throw new NotFoundError("Test Result");
    }

    if (!isAdmin && result.attempt.candidateId !== candidateId) {
      throw new ForbiddenError("You are not authorized to view this test result.");
    }

    return result;
  }

  /**
   * Fetch Question-by-Question Detailed Review with Filters
   */
  public static async getDetailedQuestions(
    resultId: string,
    candidateId: string,
    filter: QuestionReviewFilterParams,
    isAdmin = false
  ) {
    const result = await prisma.testResult.findFirst({
      where: {
        OR: [
          { id: resultId },
          { attemptId: resultId },
        ],
      },
      include: {
        attempt: { select: { candidateId: true } },
      },
    });

    if (!result) throw new NotFoundError("Test Result");
    if (!isAdmin && result.attempt.candidateId !== candidateId) {
      throw new ForbiddenError("Unauthorized access to result questions.");
    }

    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.QuestionResultWhereInput = {
      testResultId: result.id,
    };

    if (filter.status === "CORRECT") {
      where.isCorrect = true;
    } else if (filter.status === "INCORRECT") {
      where.isAttempted = true;
      where.isCorrect = false;
    } else if (filter.status === "UNANSWERED") {
      where.isAttempted = false;
    } else if (filter.status === "MARKED") {
      where.isMarkedForReview = true;
    }

    const [items, total] = await Promise.all([
      prisma.questionResult.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "asc" },
        include: {
          question: {
            include: {
              options: { orderBy: { sortOrder: "asc" } },
              topic: { include: { section: true } },
            },
          },
        },
      }),
      prisma.questionResult.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * List paginated scorecards for a candidate
   */
  public static async getCandidateResults(
    candidateId: string,
    params: ResultFilterParams
  ) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.TestResultWhereInput = {
      attempt: {
        candidateId,
        ...(params.examId
          ? { mockTest: { examVersion: { examId: params.examId } } }
          : {}),
        ...(params.mockTestId ? { mockTestId: params.mockTestId } : {}),
      },
    };

    const [items, total] = await Promise.all([
      prisma.testResult.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          attempt: {
            include: {
              mockTest: {
                include: {
                  examVersion: { include: { exam: true } },
                },
              },
            },
          },
        },
      }),
      prisma.testResult.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Aggregate longitudinal candidate performance analytics
   */
  public static async getCandidatePerformance(candidateId: string) {
    const [results, examStats, topicStats] = await Promise.all([
      prisma.testResult.findMany({
        where: { attempt: { candidateId } },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          attempt: {
            include: {
              mockTest: {
                include: {
                  examVersion: { include: { exam: true } },
                },
              },
            },
          },
        },
      }),
      prisma.candidateExamStatistic.findMany({
        where: { candidateId },
        include: { examVersion: { include: { exam: true } } },
      }),
      prisma.candidateTopicStatistic.findMany({
        where: { candidateId },
        include: { topic: true },
        orderBy: { accuracyRate: "desc" },
      }),
    ]);

    const totalAttempts = results.length;
    let avgScore = 0;
    let bestScore = 0;
    let avgAccuracy = 0;

    if (totalAttempts > 0) {
      let sumScore = 0;
      let sumAcc = 0;
      for (const r of results) {
        const s = Number(r.netScore);
        sumScore += s;
        sumAcc += Number(r.accuracyRate);
        if (s > bestScore) bestScore = s;
      }
      avgScore = sumScore / totalAttempts;
      avgAccuracy = sumAcc / totalAttempts;
    }

    const strongTopics = topicStats.filter((t) => t.isStrongTopic || Number(t.accuracyRate) >= 75);
    const weakTopics = topicStats.filter((t) => t.isWeakTopic || Number(t.accuracyRate) < 50);

    const scoreTrends = results
      .slice()
      .reverse()
      .map((r, i) => ({
        index: i + 1,
        title: r.attempt.mockTest.title,
        score: Number(r.netScore),
        totalMarks: Number(r.totalMarks),
        accuracy: Number(r.accuracyRate),
        date: r.createdAt,
      }));

    return {
      totalAttempts,
      averageScore: Number(avgScore.toFixed(2)),
      bestScore: Number(bestScore.toFixed(2)),
      averageAccuracy: Number(avgAccuracy.toFixed(2)),
      strongTopics,
      weakTopics,
      examStats,
      scoreTrends,
      recentResults: results,
    };
  }
}
