import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActualPatternGeneratorService } from "@/services/mock/actual-pattern-generator.service";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "@/lib/errors";

vi.mock("@/services/document/document-readiness.service");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    examVersion: {
      findUnique: vi.fn(),
    },
    mockTest: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mockTestSection: {
      create: vi.fn(),
    },
    mockTestQuestion: {
      create: vi.fn(),
    },
    question: {
      count: vi.fn().mockResolvedValue(10),
      create: vi.fn(),
    },
    mockGenerationRequest: {
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/services/audit/audit.service", () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

describe("ActualPatternGeneratorService - Blueprint Section-by-Section Distribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate exact question distribution matching locked blueprint (e.g. 50 / 30 / 20 -> 100)", async () => {
    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-2026",
      examName: "Health Officer",
      versionName: "2026",
      year: 2026,
      isReadyForMockGeneration: true,
      missingRequiredDocuments: [],
      blueprintReady: true,
      syllabusReady: true,
      requiredChecklist: [],
      optionalChecklist: [],
      referenceChecklist: [],
    });

    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue({
      id: "ver-2026",
      examId: "exam-ho",
      year: 2026,
      versionName: "2026 Regular",
      notificationNumber: "XYZ/2026",
      exam: { id: "exam-ho", name: "Health Officer", code: "HO", authority: "Health Commission" },
      documents: [{ id: "doc-1", title: "Notification", documentType: "OFFICIAL_NOTIFICATION" }],
      blueprints: [
        {
          id: "bp-1",
          title: "Official 2026 Blueprint",
          totalQuestions: 100,
          totalMarks: 100 as unknown,
          durationMinutes: 120,
          negativeMarkingRate: 0.25 as unknown,
          sections: [
            { id: "sec-1", name: "Section A", sectionOrder: 1, questionCount: 50, marksPerQuestion: 1, negativeRate: 0.25 },
            { id: "sec-2", name: "Section B", sectionOrder: 2, questionCount: 30, marksPerQuestion: 1, negativeRate: 0.25 },
            { id: "sec-3", name: "Section C", sectionOrder: 3, questionCount: 20, marksPerQuestion: 1, negativeRate: 0.25 },
          ],
        },
      ],
      syllabi: [
        {
          id: "syl-1",
          title: "Syllabus 2026",
          isVerified: true,
          sections: [
            {
              id: "syl-sec-1",
              name: "Section A",
              sortOrder: 1,
              topics: [
                { id: "top-1", name: "Anatomy", sortOrder: 1 },
                { id: "top-2", name: "Physiology", sortOrder: 2 },
              ],
            },
            {
              id: "syl-sec-2",
              name: "Section B",
              sortOrder: 2,
              topics: [
                { id: "top-3", name: "Pharmacology", sortOrder: 1 },
              ],
            },
            {
              id: "syl-sec-3",
              name: "Section C",
              sortOrder: 3,
              topics: [
                { id: "top-4", name: "Community Medicine", sortOrder: 1 },
              ],
            },
          ],
        },
      ],
    } as any);

    const plan = await ActualPatternGeneratorService.buildGenerationPlan("ver-2026");

    expect(plan.totalQuestions).toBe(100);
    expect(plan.durationMinutes).toBe(120);
    expect(plan.negativeMarkingRate).toBe(0.25);
    expect(plan.sections.length).toBe(3);

    // Verify exact section distributions
    expect(plan.sections[0].sectionName).toBe("Section A");
    expect(plan.sections[0].questionCount).toBe(50);
    expect(plan.sections[1].sectionName).toBe("Section B");
    expect(plan.sections[1].questionCount).toBe(30);
    expect(plan.sections[2].sectionName).toBe("Section C");
    expect(plan.sections[2].questionCount).toBe(20);

    const totalCalculated = plan.sections.reduce((acc, s) => acc + s.questionCount, 0);
    expect(totalCalculated).toBe(100);
  });

  it("should throw BadRequestError if documents are not ready", async () => {
    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-2026",
      examName: "Health Officer",
      versionName: "2026",
      year: 2026,
      isReadyForMockGeneration: false,
      missingRequiredDocuments: ["OFFICIAL_NOTIFICATION" as unknown as any],
      blueprintReady: false,
      syllabusReady: false,
      requiredChecklist: [],
      optionalChecklist: [],
      referenceChecklist: [],
    });

    await expect(ActualPatternGeneratorService.buildGenerationPlan("ver-2026")).rejects.toThrow(
      BadRequestError
    );
  });
});
