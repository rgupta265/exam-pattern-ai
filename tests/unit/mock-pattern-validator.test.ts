import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockPatternValidatorService } from "@/services/mock/mock-pattern-validator.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mockTest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    mockValidationResult: {
      create: vi.fn(),
    },
  },
}));

describe("MockPatternValidatorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass validation when mock matches blueprint questions, marks, and sections exactly", async () => {
    vi.mocked(prisma.mockTest.findUnique).mockResolvedValueOnce({
      id: "mock-1",
      examVersionId: "ver-1",
      blueprintId: "bp-1",
      type: "FULL_MOCK",
      title: "UP CHO Full Mock",
      slug: "up-cho-mock-1",
      durationMinutes: 120,
      totalQuestions: 100,
      totalMarks: new Prisma.Decimal(100),
      negativeRate: new Prisma.Decimal(0.25),
      status: "GENERATING",
      blueprint: {
        id: "bp-1",
        totalQuestions: 100,
        totalMarks: new Prisma.Decimal(100),
        durationMinutes: 120,
        negativeMarkingRate: new Prisma.Decimal(0.25),
        sections: [
          {
            id: "bp-sec-1",
            name: "Section A",
            sectionOrder: 1,
            questionCount: 80,
            marksPerQuestion: new Prisma.Decimal(1),
            totalMarks: new Prisma.Decimal(80),
          },
          {
            id: "bp-sec-2",
            name: "Section B",
            sectionOrder: 2,
            questionCount: 20,
            marksPerQuestion: new Prisma.Decimal(1),
            totalMarks: new Prisma.Decimal(20),
          },
        ],
      },
      sections: [
        {
          id: "m-sec-1",
          name: "Section A",
          sectionOrder: 1,
          questionCount: 80,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 80 }, (_, i) => ({
            id: `mq-${i}`,
            questionId: `q-${i}`,
            questionOrder: i + 1,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-${i}`,
              questionText: `Question ${i}`,
              topic: {
                id: "topic-1",
                section: {
                  syllabus: {
                    examVersionId: "ver-1",
                  },
                },
              },
            },
          })),
        },
        {
          id: "m-sec-2",
          name: "Section B",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 20 }, (_, i) => ({
            id: `mq-${80 + i}`,
            questionId: `q-${80 + i}`,
            questionOrder: 81 + i,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-${80 + i}`,
              questionText: `Question ${80 + i}`,
              topic: {
                id: "topic-2",
                section: {
                  syllabus: {
                    examVersionId: "ver-1",
                  },
                },
              },
            },
          })),
        },
      ],
    } as unknown as any);

    const report = await MockPatternValidatorService.validate("mock-1");

    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(prisma.mockTest.update).toHaveBeenCalledWith({
      where: { id: "mock-1" },
      data: { status: "VALIDATED" },
    });
  });

  it("should fail validation when mock question count does not match blueprint", async () => {
    vi.mocked(prisma.mockTest.findUnique).mockResolvedValueOnce({
      id: "mock-invalid",
      examVersionId: "ver-1",
      blueprintId: "bp-1",
      type: "FULL_MOCK",
      durationMinutes: 120,
      totalQuestions: 100,
      totalMarks: new Prisma.Decimal(100),
      negativeRate: new Prisma.Decimal(0.25),
      blueprint: {
        id: "bp-1",
        totalQuestions: 100,
        totalMarks: new Prisma.Decimal(100),
        durationMinutes: 120,
        sections: [
          { id: "bp-sec-1", sectionOrder: 1, questionCount: 100, marksPerQuestion: new Prisma.Decimal(1) },
        ],
      },
      sections: [
        {
          id: "m-sec-1",
          sectionOrder: 1,
          questions: Array.from({ length: 90 }, (_, i) => ({
            id: `mq-${i}`,
            questionId: `q-${i}`,
            marks: new Prisma.Decimal(1),
            question: { topic: { section: { syllabus: { examVersionId: "ver-1" } } } },
          })),
        },
      ],
    } as unknown as any);

    const report = await MockPatternValidatorService.validate("mock-invalid");

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("Total questions (90) != Blueprint (100)"))).toBe(true);
    expect(prisma.mockTest.update).toHaveBeenCalledWith({
      where: { id: "mock-invalid" },
      data: { status: "VALIDATION_FAILED" },
    });
  });
});
