import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScoreCalculationService } from "@/services/result/score-calculation.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    testAttempt: {
      findUnique: vi.fn(),
    },
    testResult: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    candidateExamStatistic: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    candidateTopicStatistic: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe("ScoreCalculationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate correct positive marks and deduct negative penalties accurately", async () => {
    const mockAttempt = {
      id: "attempt-1",
      candidateId: "cand-1",
      mockTest: {
        id: "mock-1",
        examVersionId: "ver-1",
        totalQuestions: 4,
        totalMarks: new Prisma.Decimal(4.0),
        sections: [
          {
            id: "sec-1",
            name: "Clinical",
            sectionOrder: 1,
            marksPerQuestion: new Prisma.Decimal(1.0),
            questions: [
              {
                id: "mq-1",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-1",
                  topic: { id: "top-1", name: "Anatomy" },
                  options: [
                    { id: "opt-1", optionKey: "A", isCorrect: true },
                    { id: "opt-2", optionKey: "B", isCorrect: false },
                  ],
                },
              },
              {
                id: "mq-2",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-2",
                  topic: { id: "top-1", name: "Anatomy" },
                  options: [
                    { id: "opt-3", optionKey: "A", isCorrect: false },
                    { id: "opt-4", optionKey: "B", isCorrect: true },
                  ],
                },
              },
              {
                id: "mq-3",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-3",
                  topic: { id: "top-2", name: "Physiology" },
                  options: [
                    { id: "opt-5", optionKey: "A", isCorrect: true },
                    { id: "opt-6", optionKey: "B", isCorrect: false },
                  ],
                },
              },
              {
                id: "mq-4",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-4",
                  topic: { id: "top-2", name: "Physiology" },
                  options: [
                    { id: "opt-7", optionKey: "A", isCorrect: true },
                    { id: "opt-8", optionKey: "B", isCorrect: false },
                  ],
                },
              },
            ],
          },
        ],
      },
      answers: [
        { questionId: "q-1", selectedOptionId: "opt-1", timeSpentSeconds: 30, isMarkedForReview: false }, // Correct (+1.0)
        { questionId: "q-2", selectedOptionId: "opt-3", timeSpentSeconds: 40, isMarkedForReview: false }, // Incorrect (-0.25)
        { questionId: "q-3", selectedOptionId: "opt-5", timeSpentSeconds: 25, isMarkedForReview: false }, // Correct (+1.0)
        { questionId: "q-4", selectedOptionId: null, timeSpentSeconds: 10, isMarkedForReview: true },    // Unanswered (0.0)
      ],
    };

    vi.mocked(prisma.testAttempt.findUnique).mockResolvedValueOnce(mockAttempt as unknown as any);
    vi.mocked(prisma.testResult.findUnique).mockResolvedValueOnce(null);
    (prisma.testResult.create as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async ({ data }: any) => ({
      id: "result-1",
      ...data,
    }));

    const result = await ScoreCalculationService.calculateAndPersistResult("attempt-1");

    // Correct: 2 (+2.0), Incorrect: 1 (-0.25), Unattempted: 1 (0)
    // Raw score = 2.0, Penalty = 0.25, Net score = 1.75
    // Attempted: 3, Accuracy = (2/3) * 100 = 66.67%
    expect(Number(result.rawScore)).toBe(2.0);
    expect(Number(result.penaltyDeduction)).toBe(0.25);
    expect(Number(result.netScore)).toBe(1.75);
    expect(result.correctAnswers).toBe(2);
    expect(result.incorrectAnswers).toBe(1);
    expect(result.unattemptedQuestions).toBe(1);
    expect(result.attemptedQuestions).toBe(3);
    expect(Number(result.accuracyRate)).toBeCloseTo(66.67, 1);
  });
});
