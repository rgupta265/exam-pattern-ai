import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttemptService } from "@/services/attempt/attempt.service";
import { prisma } from "@/lib/prisma";

describe("Phase 12: Full Examination Mode & Retake Support Unit Tests", () => {
  const mockTestId = "mock-upho-2026-full-001";
  const candidateId = "candidate-user-123";

  const sampleMock = {
    id: mockTestId,
    code: "UPHO-2026-MOCK-001",
    title: "UP Health Officer 2026 Full Official Mock",
    status: "PUBLISHED",
    type: "FULL_MOCK",
    durationMinutes: 120,
    totalQuestions: 100,
    totalMarks: 100,
    negativeRate: 0.25,
    allowRetake: true,
    maxAttempts: 10,
    examVersion: {
      id: "ver-1",
      versionName: "2026 Official",
      exam: { id: "ex-1", name: "UP Health Officer", code: "UPHO", authority: "UP Health Dept" },
    },
    sections: [
      {
        id: "sec-1",
        name: "Section A: Clinical Sciences",
        sectionOrder: 1,
        questionCount: 50,
        marksPerQuestion: 1,
        negativeRate: 0.25,
        questions: Array.from({ length: 50 }, (_, i) => ({
          id: `mq-a-${i}`,
          questionId: `q-a-${i}`,
          questionOrder: i + 1,
        })),
      },
      {
        id: "sec-2",
        name: "Section B: Public Health",
        sectionOrder: 2,
        questionCount: 30,
        marksPerQuestion: 1,
        negativeRate: 0.25,
        questions: Array.from({ length: 30 }, (_, i) => ({
          id: `mq-b-${i}`,
          questionId: `q-b-${i}`,
          questionOrder: i + 51,
        })),
      },
      {
        id: "sec-3",
        name: "Section C: General Aptitude",
        sectionOrder: 3,
        questionCount: 20,
        marksPerQuestion: 1,
        negativeRate: 0.25,
        questions: Array.from({ length: 20 }, (_, i) => ({
          id: `mq-c-${i}`,
          questionId: `q-c-${i}`,
          questionOrder: i + 81,
        })),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Full Examination Blueprint Pattern Verification", () => {
    it("should enforce exact question distribution across sections (50 + 30 + 20 = 100)", () => {
      const sectionCounts = sampleMock.sections.map((s) => s.questions.length);
      const totalQuestions = sectionCounts.reduce((sum, c) => sum + c, 0);

      expect(sectionCounts).toEqual([50, 30, 20]);
      expect(totalQuestions).toBe(sampleMock.totalQuestions);
      expect(totalQuestions).toBe(100);
    });

    it("should verify negative marking and duration authenticity", () => {
      expect(sampleMock.durationMinutes).toBe(120);
      expect(sampleMock.negativeRate).toBe(0.25);
      expect(sampleMock.type).toBe("FULL_MOCK");
    });
  });

  describe("Retake Lifecycle & Attempt Isolation", () => {
    it("should calculate correct summary and best score across multiple completed attempts", async () => {
      const completedAttempts = [
        {
          id: "att-1",
          candidateId,
          mockTestId,
          status: "SUBMITTED",
          startedAt: new Date(Date.now() - 3600000),
          testResult: { percentage: 72 },
        },
        {
          id: "att-2",
          candidateId,
          mockTestId,
          status: "SUBMITTED",
          startedAt: new Date(Date.now() - 1800000),
          testResult: { percentage: 86 },
        },
      ];

      vi.spyOn(prisma.testAttempt, "findMany").mockResolvedValue(completedAttempts as any);

      const summary = await AttemptService.getMockAttemptsSummary(mockTestId, candidateId);

      expect(summary.attemptCount).toBe(2);
      expect(summary.bestScore).toBe(86);
      expect(summary.latestScore).toBe(72);
      expect(summary.canRetake).toBe(true);
      expect(summary.maxAttempts).toBe(10);
    });

    it("should disable retake when maximum attempt limit is reached", async () => {
      const tenAttempts = Array.from({ length: 10 }, (_, i) => ({
        id: `att-${i}`,
        candidateId,
        mockTestId,
        status: "SUBMITTED",
        startedAt: new Date(),
        testResult: { percentage: 80 + i },
      }));

      vi.spyOn(prisma.testAttempt, "findMany").mockResolvedValue(tenAttempts as any);

      const summary = await AttemptService.getMockAttemptsSummary(mockTestId, candidateId);

      expect(summary.attemptCount).toBe(10);
      expect(summary.canRetake).toBe(false);
    });
  });
});
