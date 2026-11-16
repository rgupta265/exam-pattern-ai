import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { ActualPatternGeneratorService } from "@/services/mock/actual-pattern-generator.service";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { MockPatternValidatorService } from "@/services/mock/mock-pattern-validator.service";
import { geminiQuestionService } from "@/services/ai/gemini-question.service";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { SessionUser } from "@/types/auth.types";

vi.mock("@/services/document/document-readiness.service");
vi.mock("@/services/mock/mock-pattern-validator.service");
vi.mock("@/services/ai/gemini-question.service");
vi.mock("@/services/audit/audit.service", () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    examVersion: {
      findUnique: vi.fn(),
    },
    syllabusTopic: {
      findUnique: vi.fn(),
    },
    mockTest: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    mockTestSection: {
      create: vi.fn(),
    },
    mockTestQuestion: {
      create: vi.fn(),
    },
    mockValidationResult: {
      create: vi.fn(),
    },
    question: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    mockGenerationRequest: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockCandidateUser: SessionUser = {
  id: "candidate-uuid-1",
  email: "candidate@example.com",
  fullName: "Test Candidate",
  roles: ["CANDIDATE"],
  permissions: ["CANDIDATE_SELF_ATTEMPT", "CANDIDATE_SELF_VIEW"],
};

describe("Candidate End Mock Generation: Topic Drills & 100% Accurate Full Mocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Candidate Full Pattern Mock Generation with Exact Question Count
  it("should allow candidate to generate 100% blueprint-accurate full mock test with exact question count", async () => {
    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-sci-stage1",
      examName: "Supreme Court TAP — Stage 1",
      versionName: "2026 Regular",
      year: 2026,
      isReadyForMockGeneration: true,
      missingRequiredDocuments: [],
      blueprintReady: true,
      syllabusReady: true,
      requiredChecklist: [],
      optionalChecklist: [],
      referenceChecklist: [],
    });

    const mockExamVersion = {
      id: "ver-sci-stage1",
      examId: "exam-sci-s1",
      year: 2026,
      versionName: "2026 Regular",
      exam: {
        id: "exam-sci-s1",
        name: "Supreme Court TAP — Stage 1",
        code: "SCI-TAP-S1",
        slug: "supreme-court-tap-stage-1",
        authority: "Supreme Court of India",
      },
      documents: [{ id: "doc-sci", title: "Syllabus 2026", status: "VERIFIED" }],
      blueprints: [
        {
          id: "bp-sci-s1",
          title: "Supreme Court TAP Stage 1 Objective Blueprint",
          totalQuestions: 100,
          totalMarks: 100 as unknown,
          durationMinutes: 90,
          negativeMarkingRate: 0.25 as unknown,
          sections: [
            { id: "s1", name: "General English & Comprehension", sectionOrder: 1, questionCount: 50, marksPerQuestion: 1, negativeRate: 0.25 },
            { id: "s2", name: "General Intelligence & Reasoning", sectionOrder: 2, questionCount: 20, marksPerQuestion: 1, negativeRate: 0.25 },
            { id: "s3", name: "Quantitative Aptitude", sectionOrder: 3, questionCount: 20, marksPerQuestion: 1, negativeRate: 0.25 },
            { id: "s4", name: "General Awareness & Judicial Overview", sectionOrder: 4, questionCount: 10, marksPerQuestion: 1, negativeRate: 0.25 },
          ],
        },
      ],
      syllabi: [
        {
          id: "syl-sci-s1",
          isVerified: true,
          sections: [
            {
              id: "syl-sec-1",
              name: "General English & Comprehension",
              sortOrder: 1,
              topics: [
                { id: "top-eng-1", name: "English Grammar & Usage", sortOrder: 1 },
                { id: "top-eng-2", name: "Vocabulary & Comprehension", sortOrder: 2 },
              ],
            },
            {
              id: "syl-sec-2",
              name: "General Intelligence & Reasoning",
              sortOrder: 2,
              topics: [{ id: "top-reas-1", name: "Logical Reasoning", sortOrder: 1 }],
            },
            {
              id: "syl-sec-3",
              name: "Quantitative Aptitude",
              sortOrder: 3,
              topics: [{ id: "top-quant-1", name: "Arithmetic & Data", sortOrder: 1 }],
            },
            {
              id: "syl-sec-4",
              name: "General Awareness & Judicial Overview",
              sortOrder: 4,
              topics: [{ id: "top-gk-1", name: "Judicial Overview", sortOrder: 1 }],
            },
          ],
        },
      ],
    };

    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue(mockExamVersion as any);
    vi.mocked(prisma.question.count).mockResolvedValue(100);
    vi.mocked(prisma.mockTest.count).mockResolvedValue(2);
    vi.mocked(prisma.mockTest.create).mockResolvedValue({
      id: "mock-sci-s1-new",
      code: "SCITAPS1-2026-MOCK-003",
      title: "Supreme Court TAP — Stage 1 2026 Full Pattern Mock #3",
      totalQuestions: 100,
      totalMarks: 100 as any,
      durationMinutes: 90,
      negativeRate: 0.25 as any,
      status: "GENERATING",
    } as any);

    (vi.mocked(prisma.mockTestSection.create) as any).mockImplementation((args: any) =>
      Promise.resolve({ id: `sec-${args.data.sectionOrder}`, ...args.data })
    );

    // Mock existing questions
    vi.mocked(prisma.question.findMany).mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({
        id: `q-${i + 1}`,
        questionText: `Sample question ${i + 1}`,
        options: [
          { optionKey: "A", optionText: "Opt A", isCorrect: true },
          { optionKey: "B", optionText: "Opt B", isCorrect: false },
        ],
      })) as any
    );

    vi.mocked(prisma.mockGenerationRequest.create).mockResolvedValue({ id: "req-1" } as any);
    vi.mocked(prisma.mockGenerationRequest.update).mockResolvedValue({ id: "req-1" } as any);
    vi.mocked(MockPatternValidatorService.validate).mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      scoreReport: {
        mockTestId: "mock-sci-s1-new",
        totalQuestions: 100,
        checks: [
          { name: "Total Question Count Alignment", passed: true, expected: 100, actual: 100 },
          { name: "Section-by-Section Distribution", passed: true, expected: "4 Sections", actual: "4 Sections" },
        ],
      },
    } as any);

    vi.mocked(prisma.mockTest.update).mockResolvedValue({
      id: "mock-sci-s1-new",
      code: "SCITAPS1-2026-MOCK-003",
      totalQuestions: 100,
      status: "PUBLISHED",
    } as any);

    const result = await ActualPatternGeneratorService.generateActualPatternMock({
      examVersionId: "ver-sci-stage1",
      user: mockCandidateUser,
    });

    expect(result.mockTest.id).toBe("mock-sci-s1-new");
    expect(result.mockTest.totalQuestions).toBe(100);
    expect(result.mockTest.status).toBe("PUBLISHED");
    expect(result.validationReport.isValid).toBe(true);
    expect(MockPatternValidatorService.validate).toHaveBeenCalledWith("mock-sci-s1-new");
  });

  // 2. Candidate Topic-Specific Practice Drill Generation
  it("should allow candidate to generate topic practice drill matching verified syllabus topic with exact question count", async () => {
    vi.mocked(prisma.syllabusTopic.findUnique).mockResolvedValue({
      id: "top-dsa-1",
      name: "Data Structures & Algorithms",
      section: {
        id: "sec-dsa",
        name: "Data Structures, Algorithms & Programming",
        syllabus: {
          examVersionId: "ver-sci-stage2",
          examVersion: {
            id: "ver-sci-stage2",
            year: 2026,
            versionName: "2026 Regular",
            exam: { id: "exam-sci-s2", name: "Supreme Court TAP — Stage 2", code: "SCI-TAP-S2", slug: "sci-tap-stage-2", authority: "Supreme Court" },
            blueprints: [{ id: "bp-sci-s2", negativeMarkingRate: 0.25 as any }],
          },
        },
      },
    } as any);

    vi.mocked(prisma.mockTest.count).mockResolvedValue(1);
    vi.mocked(prisma.mockTest.create).mockResolvedValue({
      id: "mock-topic-drill-1",
      code: "SCITAPS2-2026-TOPIC-002",
      type: "TOPIC_PRACTICE",
      totalQuestions: 15,
      durationMinutes: 18,
      status: "PUBLISHED",
    } as any);

    vi.mocked(prisma.mockTestSection.create).mockResolvedValue({ id: "sec-drill-1" } as any);

    // Mock existing questions in question bank for this topic (10 items)
    vi.mocked(prisma.question.findMany).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: `q-dsa-${i + 1}`,
        questionText: `DSA Question ${i + 1}`,
        options: [{ optionKey: "A", optionText: "Option A", isCorrect: true }],
      })) as any
    );

    // Mock Gemini generating the remaining 5 missing questions
    vi.mocked(geminiQuestionService.generateQuestions).mockResolvedValue({
      examName: "Supreme Court TAP — Stage 2",
      sectionName: "Data Structures, Algorithms & Programming",
      topicName: "Data Structures & Algorithms",
      difficulty: "MEDIUM",
      questions: Array.from({ length: 5 }, (_, i) => ({
        questionText: `Generated DSA question ${i + 1}`,
        explanation: "Explanation",
        difficulty: "MEDIUM" as const,
        correctAnswer: "A",
        options: [
          { key: "A", text: "Opt A", isCorrect: true },
          { key: "B", text: "Opt B", isCorrect: false },
        ],
      })),
    } as any);

    (vi.mocked(prisma.question.create) as any).mockImplementation((args: any) =>
      Promise.resolve({ id: `q-gen-${Date.now()}`, ...args.data })
    );

    const drillResult = await MockEngineService.generateTopicPracticeMock(
      {
        examVersionId: "ver-sci-stage2",
        topicId: "top-dsa-1",
        questionCount: 15,
        difficulty: "MEDIUM",
        language: "English",
      },
      mockCandidateUser
    );

    expect(drillResult.id).toBe("mock-topic-drill-1");
    expect(drillResult.totalQuestions).toBe(15);
    expect(drillResult.status).toBe("PUBLISHED");
    expect(prisma.mockValidationResult.create).toHaveBeenCalled();
  });

  // 3. Reject Topic Drill when topic does not belong to the verified exam syllabus
  it("should reject topic practice drill request if topic is outside verified syllabus", async () => {
    vi.mocked(prisma.syllabusTopic.findUnique).mockResolvedValue({
      id: "foreign-topic-1",
      name: "Astronomy",
      section: {
        syllabus: {
          examVersionId: "different-version-uuid",
        },
      },
    } as any);

    await expect(
      MockEngineService.generateTopicPracticeMock(
        {
          examVersionId: "ver-sci-stage1",
          topicId: "foreign-topic-1",
          questionCount: 10,
          difficulty: "MEDIUM",
          language: "English",
        },
        mockCandidateUser
      )
    ).rejects.toThrow(ValidationError);
  });
});
