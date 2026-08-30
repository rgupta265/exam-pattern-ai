import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttemptService } from "@/services/attempt/attempt.service";
import { ResultService } from "@/services/result/result.service";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    testAttempt: {
      findUnique: vi.fn(),
    },
    testResult: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("Candidate Data Isolation & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deny candidate access to an attempt belonging to another candidate", async () => {
    vi.mocked(prisma.testAttempt.findUnique).mockResolvedValueOnce({
      id: "attempt-user-a",
      candidateId: "user-a",
      startedAt: new Date(),
      mockTest: { durationMinutes: 60, sections: [] },
      answers: [],
      testResult: null,
    } as any);

    await expect(
      AttemptService.getAttemptForExam("attempt-user-a", "user-b-intruder", false)
    ).rejects.toThrow(ForbiddenError);
  });

  it("should deny candidate access to a scorecard belonging to another candidate", async () => {
    vi.mocked(prisma.testResult.findFirst).mockResolvedValueOnce({
      id: "result-user-a",
      attempt: { candidateId: "user-a" },
    } as any);

    await expect(
      ResultService.getResultById("result-user-a", "user-b-intruder", false)
    ).rejects.toThrow(ForbiddenError);
  });
});
