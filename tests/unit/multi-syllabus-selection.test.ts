import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyllabusSelectionService } from "@/services/syllabus/syllabus-selection.service";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    examVersion: {
      findUnique: vi.fn(),
    },
    syllabus: {
      findMany: vi.fn(),
    },
  },
}));

describe("SyllabusSelectionService - Multi-Syllabus Selection & Server-Side Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate and return topics belonging to the verified syllabus of the exam version", async () => {
    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue({
      id: "ver-2026",
      examId: "exam-ho",
      year: 2026,
      versionName: "2026 Regular",
      syllabi: [
        {
          id: "syl-1",
          title: "Official Syllabus",
          isVerified: true,
          sections: [
            {
              id: "sec-1",
              name: "Clinical Anatomy",
              sortOrder: 1,
              topics: [
                { id: "top-1", name: "Cardiovascular System", code: "ANAT-01", weightagePercentage: 10 as unknown },
                { id: "top-2", name: "Respiratory System", code: "ANAT-02", weightagePercentage: 10 as unknown },
              ],
            },
          ],
        },
      ],
    } as any);

    const validated = await SyllabusSelectionService.validateSelection("ver-2026", [
      "top-1",
      "top-2",
    ]);

    expect(validated.length).toBe(2);
    expect(validated[0].name).toBe("Cardiovascular System");
    expect(validated[1].name).toBe("Respiratory System");
  });

  it("should throw ValidationError if foreign topic IDs are supplied", async () => {
    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue({
      id: "ver-2026",
      examId: "exam-ho",
      year: 2026,
      versionName: "2026 Regular",
      syllabi: [
        {
          id: "syl-1",
          title: "Official Syllabus",
          isVerified: true,
          sections: [
            {
              id: "sec-1",
              name: "Clinical Anatomy",
              sortOrder: 1,
              topics: [
                { id: "top-1", name: "Cardiovascular System", code: "ANAT-01" },
              ],
            },
          ],
        },
      ],
    } as any);

    // "foreign-topic-999" is not in this syllabus!
    await expect(
      SyllabusSelectionService.validateSelection("ver-2026", ["top-1", "foreign-topic-999"])
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError if empty topic array is supplied", async () => {
    await expect(SyllabusSelectionService.validateSelection("ver-2026", [])).rejects.toThrow(
      ValidationError
    );
  });
});
