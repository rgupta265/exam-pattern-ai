import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttemptService } from "@/services/attempt/attempt.service";
import { prisma } from "@/lib/prisma";
import { BadRequestError, ForbiddenError } from "@/lib/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mockTest: {
      findFirst: vi.fn(),
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
    $transaction: vi.fn((callbacks) => {
      if (Array.isArray(callbacks)) {
        return Promise.all(callbacks);
      }
      return callbacks(prisma);
    }),
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
      id: "res-123",
      netScore: 50,
    }),
  },
}));

describe("AttemptService Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an attempt with pre-populated answers and start event", async () => {
    vi.mocked(prisma.mockTest.findFirst).mockResolvedValueOnce({
      id: "mock-1",
      title: "UP Health Officer Mock 1",
      status: "PUBLISHED",
      durationMinutes: 120,
      totalQuestions: 1,
      examVersionId: "ver-1",
      sections: [
        {
          id: "sec-1",
          sectionOrder: 1,
          questions: [{ id: "mq-1", questionId: "q-1", questionOrder: 1 }],
        },
      ],
    } as any);

    vi.mocked(prisma.testAttempt.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.testAttempt.create).mockResolvedValueOnce({
      id: "attempt-1",
      candidateId: "cand-1",
      mockTestId: "mock-1",
      status: "IN_PROGRESS",
      startedAt: new Date(),
    } as any);

    const attempt = await AttemptService.createAttempt("mock-1", "cand-1");

    expect(attempt.id).toBe("attempt-1");
    expect(prisma.testAttempt.create).toHaveBeenCalled();
  });

  it("should resume an ongoing attempt idempotently", async () => {
    const existingActive = {
      id: "attempt-existing",
      candidateId: "cand-1",
      mockTestId: "mock-1",
      status: "IN_PROGRESS",
      startedAt: new Date(Date.now() - 60000), // 1 min ago
    };

    vi.mocked(prisma.mockTest.findFirst).mockResolvedValueOnce({
      id: "mock-1",
      title: "UP Health Officer Mock 1",
      status: "PUBLISHED",
      durationMinutes: 120,
      sections: [],
    } as any);

    vi.mocked(prisma.testAttempt.findFirst).mockResolvedValueOnce(existingActive as any);

    const attempt = await AttemptService.createAttempt("mock-1", "cand-1");
    expect(attempt.id).toBe("attempt-existing");
  });

  it("should reject saveAnswer when attempt is already submitted", async () => {
    vi.mocked(prisma.testAttempt.findUnique).mockResolvedValueOnce({
      id: "attempt-closed",
      candidateId: "cand-1",
      status: "SUBMITTED",
      mockTest: { durationMinutes: 60 },
    } as any);

    await expect(
      AttemptService.saveAnswer(
        "attempt-closed",
        { questionId: "00000000-0000-0000-0000-000000000001", selectedOptionId: null },
        "cand-1"
      )
    ).rejects.toThrow(BadRequestError);
  });
});
