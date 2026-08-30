import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResultService } from "@/services/result/result.service";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    testResult: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    questionResult: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("ResultService Lookup by Result ID and Attempt ID", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch result by resultId successfully", async () => {
    const mockResult = {
      id: "res-uuid-1",
      attemptId: "att-uuid-1",
      attempt: {
        candidateId: "cand-123",
        candidate: { id: "cand-123", fullName: "Test User", email: "test@example.com" },
        mockTest: {
          examVersion: { exam: { category: { name: "Govt" } } },
        },
      },
      sectionResults: [],
      topicResults: [],
    };

    vi.mocked(prisma.testResult.findFirst).mockResolvedValueOnce(mockResult as never);

    const result = await ResultService.getResultById("res-uuid-1", "cand-123");
    expect(result.id).toBe("res-uuid-1");
    expect(prisma.testResult.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ id: "res-uuid-1" }, { attemptId: "res-uuid-1" }],
        },
      })
    );
  });

  it("should fetch result seamlessly when attemptId is provided", async () => {
    const mockResult = {
      id: "res-uuid-1",
      attemptId: "att-uuid-1",
      attempt: {
        candidateId: "cand-123",
        candidate: { id: "cand-123", fullName: "Test User", email: "test@example.com" },
        mockTest: {
          examVersion: { exam: { category: { name: "Govt" } } },
        },
      },
      sectionResults: [],
      topicResults: [],
    };

    vi.mocked(prisma.testResult.findFirst).mockResolvedValueOnce(mockResult as never);

    const result = await ResultService.getResultById("att-uuid-1", "cand-123");
    expect(result.id).toBe("res-uuid-1");
    expect(prisma.testResult.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ id: "att-uuid-1" }, { attemptId: "att-uuid-1" }],
        },
      })
    );
  });

  it("should throw NotFoundError if neither resultId nor attemptId exists", async () => {
    vi.mocked(prisma.testResult.findFirst).mockResolvedValueOnce(null);

    await expect(ResultService.getResultById("invalid-id", "cand-123")).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError if candidate does not own the result", async () => {
    const mockResult = {
      id: "res-uuid-1",
      attemptId: "att-uuid-1",
      attempt: {
        candidateId: "other-candidate",
        candidate: { id: "other-candidate", fullName: "Other User", email: "other@example.com" },
        mockTest: {
          examVersion: { exam: { category: { name: "Govt" } } },
        },
      },
      sectionResults: [],
      topicResults: [],
    };

    vi.mocked(prisma.testResult.findFirst).mockResolvedValueOnce(mockResult as never);

    await expect(ResultService.getResultById("res-uuid-1", "cand-123")).rejects.toThrow(ForbiddenError);
  });
});
