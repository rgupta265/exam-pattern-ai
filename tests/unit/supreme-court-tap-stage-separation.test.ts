import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlueprintValidationService } from "@/services/blueprint/blueprint-validation.service";
import { MockPatternValidatorService } from "@/services/mock/mock-pattern-validator.service";
import { ScoreCalculationService } from "@/services/result/score-calculation.service";
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

describe("Supreme Court TAP: Stage 1 & Stage 2 Independent Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Stage 1 Blueprint Validation (General Aptitude & English)
  it("should validate Supreme Court TAP Stage 1 Blueprint with 100 Qs across 4 sections (90 mins)", () => {
    const stage1BlueprintInput = {
      totalQuestions: 100,
      totalMarks: 100,
      durationMinutes: 90,
      hasNegativeMarking: true,
      negativeMarkingRate: 0.25,
      sections: [
        {
          name: "Section 1: General English & Comprehension",
          sectionOrder: 1,
          questionCount: 50,
          marksPerQuestion: 1,
          totalMarks: 50,
          negativeRate: 0.25,
        },
        {
          name: "Section 2: General Intelligence & Reasoning",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: 1,
          totalMarks: 20,
          negativeRate: 0.25,
        },
        {
          name: "Section 3: Quantitative Aptitude",
          sectionOrder: 3,
          questionCount: 20,
          marksPerQuestion: 1,
          totalMarks: 20,
          negativeRate: 0.25,
        },
        {
          name: "Section 4: General Awareness & Judicial Overview",
          sectionOrder: 4,
          questionCount: 10,
          marksPerQuestion: 1,
          totalMarks: 10,
          negativeRate: 0.25,
        },
      ],
    };

    const report = BlueprintValidationService.validate(stage1BlueprintInput);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.summary.calculatedQuestions).toBe(100);
    expect(report.summary.calculatedMarks).toBe(100);
  });

  // 2. Stage 2 Blueprint Validation (Technical Computer Science & Programming)
  it("should validate Supreme Court TAP Stage 2 Technical Blueprint with 50 Qs across 4 technical sections (90 mins)", () => {
    const stage2BlueprintInput = {
      totalQuestions: 50,
      totalMarks: 50,
      durationMinutes: 90,
      hasNegativeMarking: true,
      negativeMarkingRate: 0.25,
      sections: [
        {
          name: "Section 1: Data Structures, Algorithms & Programming",
          sectionOrder: 1,
          questionCount: 15,
          marksPerQuestion: 1,
          totalMarks: 15,
          negativeRate: 0.25,
        },
        {
          name: "Section 2: Database Management Systems & SQL",
          sectionOrder: 2,
          questionCount: 15,
          marksPerQuestion: 1,
          totalMarks: 15,
          negativeRate: 0.25,
        },
        {
          name: "Section 3: Computer Networks & Network Security",
          sectionOrder: 3,
          questionCount: 10,
          marksPerQuestion: 1,
          totalMarks: 10,
          negativeRate: 0.25,
        },
        {
          name: "Section 4: Operating Systems & System Architecture",
          sectionOrder: 4,
          questionCount: 10,
          marksPerQuestion: 1,
          totalMarks: 10,
          negativeRate: 0.25,
        },
      ],
    };

    const report = BlueprintValidationService.validate(stage2BlueprintInput);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.summary.calculatedQuestions).toBe(50);
    expect(report.summary.calculatedMarks).toBe(50);
  });

  // 3. Stage 1 Mock Pattern Validator Pass
  it("should pass pattern validation for Stage 1 Mock Test conforming to SCI-TAP-S1 blueprint", async () => {
    vi.mocked(prisma.mockTest.findUnique).mockResolvedValueOnce({
      id: "mock-sci-s1-1",
      examVersionId: "ver-sci-s1",
      blueprintId: "bp-sci-s1",
      type: "FULL_MOCK",
      title: "Supreme Court TAP Stage 1 — Full Mock Test 1",
      slug: "scitap-s1-mock-001",
      durationMinutes: 90,
      totalQuestions: 100,
      totalMarks: new Prisma.Decimal(100),
      negativeRate: new Prisma.Decimal(0.25),
      status: "GENERATING",
      blueprint: {
        id: "bp-sci-s1",
        totalQuestions: 100,
        totalMarks: new Prisma.Decimal(100),
        durationMinutes: 90,
        negativeMarkingRate: new Prisma.Decimal(0.25),
        sections: [
          { id: "bp-s1-sec-1", name: "General English", sectionOrder: 1, questionCount: 50, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(50) },
          { id: "bp-s1-sec-2", name: "Reasoning", sectionOrder: 2, questionCount: 20, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(20) },
          { id: "bp-s1-sec-3", name: "Quantitative Aptitude", sectionOrder: 3, questionCount: 20, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(20) },
          { id: "bp-s1-sec-4", name: "General Awareness", sectionOrder: 4, questionCount: 10, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(10) },
        ],
      },
      sections: [
        {
          id: "mock-s1-sec-1",
          name: "General English",
          sectionOrder: 1,
          questionCount: 50,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 50 }, (_, i) => ({
            id: `mq-s1-1-${i}`,
            questionId: `q-s1-1-${i}`,
            questionOrder: i + 1,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s1-1-${i}`,
              questionText: `English Question ${i}`,
              topic: { id: "top-eng", section: { syllabus: { examVersionId: "ver-sci-s1" } } },
            },
          })),
        },
        {
          id: "mock-s1-sec-2",
          name: "Reasoning",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 20 }, (_, i) => ({
            id: `mq-s1-2-${i}`,
            questionId: `q-s1-2-${i}`,
            questionOrder: 51 + i,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s1-2-${i}`,
              questionText: `Reasoning Question ${i}`,
              topic: { id: "top-reas", section: { syllabus: { examVersionId: "ver-sci-s1" } } },
            },
          })),
        },
        {
          id: "mock-s1-sec-3",
          name: "Quantitative Aptitude",
          sectionOrder: 3,
          questionCount: 20,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 20 }, (_, i) => ({
            id: `mq-s1-3-${i}`,
            questionId: `q-s1-3-${i}`,
            questionOrder: 71 + i,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s1-3-${i}`,
              questionText: `Quant Question ${i}`,
              topic: { id: "top-quant", section: { syllabus: { examVersionId: "ver-sci-s1" } } },
            },
          })),
        },
        {
          id: "mock-s1-sec-4",
          name: "General Awareness",
          sectionOrder: 4,
          questionCount: 10,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 10 }, (_, i) => ({
            id: `mq-s1-4-${i}`,
            questionId: `q-s1-4-${i}`,
            questionOrder: 91 + i,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s1-4-${i}`,
              questionText: `GK Question ${i}`,
              topic: { id: "top-gk", section: { syllabus: { examVersionId: "ver-sci-s1" } } },
            },
          })),
        },
      ],
    } as any);

    vi.mocked(prisma.mockValidationResult.create).mockResolvedValueOnce({ id: "res-s1-1" } as any);
    vi.mocked(prisma.mockTest.update).mockResolvedValueOnce({} as any);

    const result = await MockPatternValidatorService.validate("mock-sci-s1-1");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(prisma.mockTest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "VALIDATED" }),
      })
    );
  });

  // 4. Stage 2 Mock Pattern Validator Pass
  it("should pass pattern validation for Stage 2 Technical Mock conforming to SCI-TAP-S2 blueprint", async () => {
    vi.mocked(prisma.mockTest.findUnique).mockResolvedValueOnce({
      id: "mock-sci-s2-1",
      examVersionId: "ver-sci-s2",
      blueprintId: "bp-sci-s2",
      type: "FULL_MOCK",
      title: "Supreme Court TAP Stage 2 — Full Technical Mock 1",
      slug: "scitap-s2-mock-001",
      durationMinutes: 90,
      totalQuestions: 50,
      totalMarks: new Prisma.Decimal(50),
      negativeRate: new Prisma.Decimal(0.25),
      status: "GENERATING",
      blueprint: {
        id: "bp-sci-s2",
        totalQuestions: 50,
        totalMarks: new Prisma.Decimal(50),
        durationMinutes: 90,
        negativeMarkingRate: new Prisma.Decimal(0.25),
        sections: [
          { id: "bp-s2-sec-1", name: "Data Structures & Programming", sectionOrder: 1, questionCount: 15, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(15) },
          { id: "bp-s2-sec-2", name: "Database Management Systems", sectionOrder: 2, questionCount: 15, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(15) },
          { id: "bp-s2-sec-3", name: "Computer Networks", sectionOrder: 3, questionCount: 10, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(10) },
          { id: "bp-s2-sec-4", name: "Operating Systems", sectionOrder: 4, questionCount: 10, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(10) },
        ],
      },
      sections: [
        {
          id: "mock-s2-sec-1",
          name: "Data Structures & Programming",
          sectionOrder: 1,
          questionCount: 15,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 15 }, (_, i) => ({
            id: `mq-s2-1-${i}`,
            questionId: `q-s2-1-${i}`,
            questionOrder: i + 1,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s2-1-${i}`,
              questionText: `DSA Question ${i}`,
              topic: { id: "top-dsa", section: { syllabus: { examVersionId: "ver-sci-s2" } } },
            },
          })),
        },
        {
          id: "mock-s2-sec-2",
          name: "Database Management Systems",
          sectionOrder: 2,
          questionCount: 15,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 15 }, (_, i) => ({
            id: `mq-s2-2-${i}`,
            questionId: `q-s2-2-${i}`,
            questionOrder: 16 + i,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s2-2-${i}`,
              questionText: `DBMS Question ${i}`,
              topic: { id: "top-dbms", section: { syllabus: { examVersionId: "ver-sci-s2" } } },
            },
          })),
        },
        {
          id: "mock-s2-sec-3",
          name: "Computer Networks",
          sectionOrder: 3,
          questionCount: 10,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 10 }, (_, i) => ({
            id: `mq-s2-3-${i}`,
            questionId: `q-s2-3-${i}`,
            questionOrder: 31 + i,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s2-3-${i}`,
              questionText: `Networks Question ${i}`,
              topic: { id: "top-net", section: { syllabus: { examVersionId: "ver-sci-s2" } } },
            },
          })),
        },
        {
          id: "mock-s2-sec-4",
          name: "Operating Systems",
          sectionOrder: 4,
          questionCount: 10,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: Array.from({ length: 10 }, (_, i) => ({
            id: `mq-s2-4-${i}`,
            questionId: `q-s2-4-${i}`,
            questionOrder: 41 + i,
            marks: new Prisma.Decimal(1),
            negativeMarks: new Prisma.Decimal(0.25),
            question: {
              id: `q-s2-4-${i}`,
              questionText: `OS Question ${i}`,
              topic: { id: "top-os", section: { syllabus: { examVersionId: "ver-sci-s2" } } },
            },
          })),
        },
      ],
    } as any);

    vi.mocked(prisma.mockValidationResult.create).mockResolvedValueOnce({ id: "res-s2-1" } as any);
    vi.mocked(prisma.mockTest.update).mockResolvedValueOnce({} as any);

    const result = await MockPatternValidatorService.validate("mock-sci-s2-1");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(prisma.mockTest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "VALIDATED" }),
      })
    );
  });

  // 5. Cross-Stage Isolation: Reject Stage 2 Questions in Stage 1 Mock
  it("should fail validation if a mock test includes questions from another stage's exam version", async () => {
    vi.mocked(prisma.mockTest.findUnique).mockResolvedValueOnce({
      id: "mock-sci-s1-cross",
      examVersionId: "ver-sci-s1",
      blueprintId: "bp-sci-s1",
      type: "FULL_MOCK",
      title: "Invalid Mixed Stage Mock",
      slug: "invalid-mixed-mock",
      durationMinutes: 120,
      totalQuestions: 1,
      totalMarks: new Prisma.Decimal(1),
      negativeRate: new Prisma.Decimal(0.25),
      status: "GENERATING",
      blueprint: {
        id: "bp-sci-s1",
        totalQuestions: 1,
        totalMarks: new Prisma.Decimal(1),
        durationMinutes: 120,
        negativeMarkingRate: new Prisma.Decimal(0.25),
        sections: [
          { id: "bp-s1-sec-1", name: "General English", sectionOrder: 1, questionCount: 1, marksPerQuestion: new Prisma.Decimal(1), totalMarks: new Prisma.Decimal(1) },
        ],
      },
      sections: [
        {
          id: "mock-sec-1",
          name: "General English",
          sectionOrder: 1,
          questionCount: 1,
          marksPerQuestion: new Prisma.Decimal(1),
          negativeRate: new Prisma.Decimal(0.25),
          questions: [
            {
              id: "q-alien",
              questionId: "real-q-alien",
              questionOrder: 1,
              marks: new Prisma.Decimal(1),
              negativeMarks: new Prisma.Decimal(0.25),
              question: {
                id: "real-q-alien",
                questionText: "Alien Question",
                topic: {
                  id: "topic-dsa",
                  // Belongs to Stage 2 version instead of Stage 1!
                  section: { syllabus: { examVersionId: "ver-sci-s2-unrelated" } },
                },
              },
            },
          ],
        },
      ],
    } as any);

    vi.mocked(prisma.mockValidationResult.create).mockResolvedValueOnce({ id: "res-cross" } as any);
    vi.mocked(prisma.mockTest.update).mockResolvedValueOnce({} as any);

    const result = await MockPatternValidatorService.validate("mock-sci-s1-cross");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("not in verified syllabus"))).toBe(true);
  });

  // 6. Score Calculation Compliance with 0.25 Negative Marking
  it("should calculate correct candidate scores with 0.25 negative penalty for 50-mark Stage 2 test", async () => {
    // 3 Correct (+3.0), 1 Incorrect (-0.25), 1 Unattempted (0.0) -> Raw = 3.0, Penalty = 0.25, Net = 2.75 / 5.0
    const mockAttempt = {
      id: "attempt-sci-s2-1",
      candidateId: "cand-sci-1",
      mockTest: {
        id: "mock-sci-s2-1",
        examVersionId: "ver-sci-s2",
        totalQuestions: 5,
        totalMarks: new Prisma.Decimal(5.0),
        sections: [
          {
            id: "sec-sci-1",
            name: "Technical",
            sectionOrder: 1,
            marksPerQuestion: new Prisma.Decimal(1.0),
            questions: [
              {
                id: "mq-1",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-1",
                  topic: { id: "top-1", name: "DSA" },
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
                  topic: { id: "top-1", name: "DSA" },
                  options: [
                    { id: "opt-3", optionKey: "A", isCorrect: true },
                    { id: "opt-4", optionKey: "B", isCorrect: false },
                  ],
                },
              },
              {
                id: "mq-3",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-3",
                  topic: { id: "top-2", name: "DBMS" },
                  options: [
                    { id: "opt-5", optionKey: "A", isCorrect: false },
                    { id: "opt-6", optionKey: "B", isCorrect: true },
                  ],
                },
              },
              {
                id: "mq-4",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-4",
                  topic: { id: "top-2", name: "DBMS" },
                  options: [
                    { id: "opt-7", optionKey: "A", isCorrect: false },
                    { id: "opt-8", optionKey: "B", isCorrect: true },
                  ],
                },
              },
              {
                id: "mq-5",
                marks: new Prisma.Decimal(1.0),
                negativeMarks: new Prisma.Decimal(0.25),
                question: {
                  id: "q-5",
                  topic: { id: "top-3", name: "Networks" },
                  options: [
                    { id: "opt-9", optionKey: "A", isCorrect: true },
                    { id: "opt-10", optionKey: "B", isCorrect: false },
                  ],
                },
              },
            ],
          },
        ],
      },
      answers: [
        { questionId: "q-1", selectedOptionId: "opt-1", timeSpentSeconds: 30, isMarkedForReview: false }, // Correct (+1.0)
        { questionId: "q-2", selectedOptionId: "opt-3", timeSpentSeconds: 40, isMarkedForReview: false }, // Correct (+1.0)
        { questionId: "q-3", selectedOptionId: "opt-6", timeSpentSeconds: 25, isMarkedForReview: false }, // Correct (+1.0)
        { questionId: "q-4", selectedOptionId: "opt-7", timeSpentSeconds: 45, isMarkedForReview: false }, // Incorrect (-0.25)
        { questionId: "q-5", selectedOptionId: null, timeSpentSeconds: 10, isMarkedForReview: true },     // Unattempted (0.0)
      ],
    };

    vi.mocked(prisma.testAttempt.findUnique).mockResolvedValueOnce(mockAttempt as any);
    vi.mocked(prisma.testResult.findUnique).mockResolvedValueOnce(null);
    (prisma.testResult.create as any).mockImplementationOnce(async ({ data }: any) => ({
      id: "result-sci-s2-1",
      ...data,
    }));

    const result = await ScoreCalculationService.calculateAndPersistResult("attempt-sci-s2-1");
    expect(Number(result.rawScore)).toBe(3.0);
    expect(Number(result.penaltyDeduction)).toBe(0.25);
    expect(Number(result.netScore)).toBe(2.75);
    expect(result.correctAnswers).toBe(3);
    expect(result.incorrectAnswers).toBe(1);
    expect(result.unattemptedQuestions).toBe(1);
    expect(result.attemptedQuestions).toBe(4);
    expect(Number(result.accuracyRate)).toBe(75.0);
  });
});
