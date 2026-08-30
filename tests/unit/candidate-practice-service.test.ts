import { describe, it, expect, vi, beforeEach } from "vitest";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, BadRequestError } from "@/lib/errors";

vi.mock("@/services/storage", () => ({
  storageService: {
    saveFile: vi.fn().mockResolvedValue({ id: "file-stored-1" }),
  },
}));

vi.mock("@/services/ai/document-content-extractor.service", () => ({
  DocumentContentExtractor: {
    extract: vi.fn().mockResolvedValue({
      text: "Anatomy study notes on the cardiovascular system and heart ventricles.",
      sourceType: "PDF",
      wordCount: 10,
      preview: "Anatomy study notes...",
    }),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    practiceResource: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    practiceTest: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    practiceTestQuestion: {
      create: vi.fn(),
    },
    practiceAttempt: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    practiceAnswer: {
      upsert: vi.fn(),
    },
    practiceResult: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe("CandidatePracticeService - Isolated Candidate Practice System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enforce candidate resource isolation (Candidate A cannot use Candidate B's resource)", async () => {
    vi.mocked(prisma.practiceResource.findUnique).mockResolvedValue({
      id: "res-b",
      candidateId: "candidate-B", // Belongs to Candidate B!
      resourceType: "DOCUMENT",
      title: "Private Notes B",
      rawText: "Sample text",
      createdAt: new Date(),
      updatedAt: new Date(),
      fileId: null,
      fileType: null,
      sourceUrl: null,
      urlHostname: null,
      contentHash: "hash",
      extractionStatus: "COMPLETED",
    });

    // Candidate A attempts to generate test using Candidate B's resource
    await expect(
      CandidatePracticeService.generatePracticeTest({
        candidateId: "candidate-A",
        resourceId: "res-b",
        questionCount: 10,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("should create practice resource from pasted text notes with length validation", async () => {
    // Too short text (<20 chars) should fail
    await expect(
      CandidatePracticeService.createResourceFromText({
        candidateId: "cand-1",
        text: "Too short",
      })
    ).rejects.toThrow(BadRequestError);

    vi.mocked(prisma.practiceResource.create).mockResolvedValue({
      id: "res-1",
      candidateId: "cand-1",
      resourceType: "TEXT",
      title: "My Anatomy Notes",
      rawText: "Detailed revision notes on the circulatory system and cardiac cycle.",
      contentHash: "hash",
      extractionStatus: "COMPLETED",
      createdAt: new Date(),
      updatedAt: new Date(),
      fileId: null,
      fileType: null,
      sourceUrl: null,
      urlHostname: null,
    });

    const res = await CandidatePracticeService.createResourceFromText({
      candidateId: "cand-1",
      title: "My Anatomy Notes",
      text: "Detailed revision notes on the circulatory system and cardiac cycle.",
    });

    expect(res.id).toBe("res-1");
    expect(prisma.practiceResource.create).toHaveBeenCalled();
  });

  it("should generate a unique practice test code format (PRAC-XXXXX)", () => {
    const code1 = CandidatePracticeService.generatePracticeCode();
    const code2 = CandidatePracticeService.generatePracticeCode();

    expect(code1).toMatch(/^PRAC-[A-F0-9]{6}$/);
    expect(code2).toMatch(/^PRAC-[A-F0-9]{6}$/);
    expect(code1).not.toBe(code2);
  });
});
