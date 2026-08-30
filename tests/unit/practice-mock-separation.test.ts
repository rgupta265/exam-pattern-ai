import { describe, it, expect, vi, beforeEach } from "vitest";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    practiceAttempt: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    practiceResult: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe("Practice / Official Mock Separation Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate practice score and save into practiceResult without modifying official candidate stats", async () => {
    const mockAttempt = {
      id: "prac-attempt-1",
      candidateId: "candidate-1",
      practiceTestId: "prac-test-1",
      status: "IN_PROGRESS",
      startedAt: new Date(),
      submittedAt: null,
      totalTimeSpentSeconds: 120,
      practiceTest: {
        id: "prac-test-1",
        title: "Cardio Practice Drill",
        questions: [
          {
            id: "q-1",
            marks: 1.0,
            negativeMarks: 0.0,
            options: [
              { id: "opt-1", isCorrect: true },
              { id: "opt-2", isCorrect: false },
            ],
          },
          {
            id: "q-2",
            marks: 1.0,
            negativeMarks: 0.0,
            options: [
              { id: "opt-3", isCorrect: true },
              { id: "opt-4", isCorrect: false },
            ],
          },
        ],
      },
      answers: [
        { questionId: "q-1", selectedOptionId: "opt-1" }, // Correct
        { questionId: "q-2", selectedOptionId: "opt-4" }, // Incorrect
      ],
    };

    vi.mocked(prisma.practiceAttempt.findFirst).mockResolvedValue(mockAttempt as any);
    vi.mocked(prisma.practiceAttempt.update).mockResolvedValue({ id: "prac-attempt-1", status: "SUBMITTED" } as any);
    vi.mocked(prisma.practiceResult.upsert).mockResolvedValue({
      id: "prac-res-1",
      attemptId: "prac-attempt-1",
      score: new Prisma.Decimal(1.0),
      totalMarks: new Prisma.Decimal(2.0),
      accuracyRate: new Prisma.Decimal(50.0),
      percentage: new Prisma.Decimal(50.0),
      totalQuestions: 2,
      attemptedQuestions: 2,
      correctAnswers: 1,
      incorrectAnswers: 1,
      unattemptedQuestions: 0,
      geminiFeedback: "Good job!",
      createdAt: new Date(),
    });

    const submission = await CandidatePracticeService.submitPracticeAttempt({
      attemptId: "prac-attempt-1",
      candidateId: "candidate-1",
    });

    expect(prisma.practiceResult.upsert).toHaveBeenCalled();
    expect(submission.result?.correctAnswers).toBe(1);
    expect(submission.result?.incorrectAnswers).toBe(1);
    expect(Number(submission.result?.accuracyRate)).toBe(50);
  });
});
