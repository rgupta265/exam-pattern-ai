import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

export class CandidateAdminService {
  /**
   * List candidates with search and pagination
   */
  public static async getCandidates(params: { search?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 15));
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      userRoles: {
        some: {
          role: {
            name: "CANDIDATE",
          },
        },
      },
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { fullName: { contains: params.search.trim() } },
              { email: { contains: params.search.trim() } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              testAttempts: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  public static async getCandidateById(candidateId: string) {
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        testAttempts: {
          orderBy: { startedAt: "desc" },
          take: 5,
          include: {
            mockTest: {
              include: { examVersion: { include: { exam: true } } },
            },
            testResult: true,
          },
        },
        examStats: {
          include: { examVersion: { include: { exam: true } } },
        },
      },
    });

    if (!candidate) throw new NotFoundError("Candidate");
    return candidate;
  }

  public static async getCandidateAttempts(candidateId: string) {
    return prisma.testAttempt.findMany({
      where: { candidateId },
      orderBy: { startedAt: "desc" },
      include: {
        mockTest: {
          include: { examVersion: { include: { exam: true } } },
        },
        testResult: true,
      },
    });
  }

  public static async getCandidateAttemptDetail(candidateId: string, attemptId: string) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, candidateId },
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
                      include: { options: { orderBy: { sortOrder: "asc" } }, topic: true },
                    },
                  },
                },
              },
            },
          },
        },
        answers: {
          include: { selectedOption: true },
        },
        answerEvents: {
          orderBy: { createdAt: "asc" },
        },
        attemptEvents: {
          orderBy: { createdAt: "asc" },
        },
        testResult: {
          include: {
            sectionResults: true,
            topicResults: true,
            questionResults: true,
          },
        },
      },
    });

    if (!attempt) throw new NotFoundError("Test Attempt");
    return attempt;
  }

  public static async getCandidateActivityLogs(candidateId: string) {
    const [attemptEvents, answerEvents] = await Promise.all([
      prisma.attemptEvent.findMany({
        where: { attempt: { candidateId } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { attempt: { include: { mockTest: true } } },
      }),
      prisma.answerEvent.findMany({
        where: { attempt: { candidateId } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { attempt: { include: { mockTest: true } } },
      }),
    ]);

    const merged = [
      ...attemptEvents.map((e) => ({
        id: e.id,
        type: "ATTEMPT_EVENT",
        eventType: e.eventType,
        data: e.eventData,
        mockTitle: e.attempt.mockTest.title,
        timestamp: e.createdAt,
      })),
      ...answerEvents.map((e) => ({
        id: e.id,
        type: "ANSWER_EVENT",
        eventType: e.eventType,
        data: { previous: e.previousValue, new: e.newValue },
        mockTitle: e.attempt.mockTest.title,
        timestamp: e.createdAt,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return merged.slice(0, 50);
  }
}
