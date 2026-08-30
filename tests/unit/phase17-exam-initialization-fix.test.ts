import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttemptService } from "@/services/attempt/attempt.service";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, BadRequestError } from "@/lib/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mockTest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    testAttempt: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
    },
    testAnswer: {
      findUnique: vi.fn(),
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    answerEvent: {
      create: vi.fn(),
    },
    attemptEvent: {
      create: vi.fn(),
    },
    testResult: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb) => (Array.isArray(cb) ? Promise.all(cb) : cb(prisma))),
  },
}));

vi.mock("@/services/audit/audit.service", () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/services/result/score-calculation.service", () => ({
  ScoreCalculationService: {
    calculateAndPersistResult: vi.fn().mockResolvedValue({
      id: "res-phase17",
      netScore: 80,
    }),
  },
}));

describe("Phase 17: Examination Initialization & Attempt Start Flow Fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return both attempt and top-level mockTest with sanitized options in getAttemptForExam", async () => {
    const mockAttempt = {
      id: "attempt-101",
      candidateId: "candidate-101",
      status: "IN_PROGRESS",
      startedAt: new Date(Date.now() - 10000), // 10s elapsed
      mockTest: {
        id: "mock-101",
        title: "Official Pattern Mock Examination",
        durationMinutes: 120,
        totalQuestions: 100,
        sections: [
          {
            id: "sec-1",
            name: "General Health",
            sectionOrder: 1,
            questions: [
              {
                id: "mq-1",
                questionOrder: 1,
                question: {
                  id: "q-1",
                  questionText: "What is the normal body temperature?",
                  questionTextHindi: "सामान्य शरीर का तापमान क्या है?",
                  questionType: "SINGLE_CHOICE",
                  difficulty: "EASY",
                  options: [
                    { id: "opt-1", optionKey: "A", optionText: "37°C", sortOrder: 1 },
                    { id: "opt-2", optionKey: "B", optionText: "40°C", sortOrder: 2 },
                  ],
                },
              },
            ],
          },
        ],
      },
      answers: [],
      testResult: null,
    };

    vi.mocked(prisma.testAttempt.findUnique).mockResolvedValueOnce(mockAttempt as any);

    const result = await AttemptService.getAttemptForExam("attempt-101", "candidate-101");

    expect(result).toBeDefined();
    expect(result.attempt.id).toBe("attempt-101");
    expect(result.mockTest).toBeDefined();
    expect(result.mockTest.title).toBe("Official Pattern Mock Examination");
    expect(result.mockTest.sections).toHaveLength(1);
    expect(result.mockTest.sections[0].questions[0].question.options).toHaveLength(2);
    expect(result.remainingSeconds).toBeGreaterThan(0);
    expect(result.isExpired).toBe(false);
  });

  it("should block candidate from accessing another candidate's exam attempt", async () => {
    const mockAttempt = {
      id: "attempt-101",
      candidateId: "candidate-OTHER",
      status: "IN_PROGRESS",
      startedAt: new Date(),
      mockTest: { durationMinutes: 60 },
    };

    vi.mocked(prisma.testAttempt.findUnique).mockResolvedValueOnce(mockAttempt as any);

    await expect(
      AttemptService.getAttemptForExam("attempt-101", "candidate-ME")
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw NotFoundError if attempt does not exist", async () => {
    vi.mocked(prisma.testAttempt.findUnique).mockResolvedValueOnce(null);

    await expect(
      AttemptService.getAttemptForExam("non-existent-attempt", "candidate-1")
    ).rejects.toThrow(NotFoundError);
  });

  it("should reject attempt creation on unpublished mock test", async () => {
    vi.mocked(prisma.mockTest.findFirst).mockResolvedValueOnce({
      id: "mock-draft",
      status: "DRAFT",
      sections: [],
    } as any);

    await expect(
      AttemptService.createAttempt("mock-draft", "cand-1")
    ).rejects.toThrow(BadRequestError);
  });
});
