import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActualPatternGeneratorService } from "@/services/mock/actual-pattern-generator.service";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { MockPatternValidatorService } from "@/services/mock/mock-pattern-validator.service";
import { geminiQuestionService } from "@/services/ai/gemini-question.service";
import { prisma } from "@/lib/prisma";
import { ValidationError, BadRequestError } from "@/lib/errors";
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

const mockAdminUser: SessionUser = {
  id: "admin-1",
  email: "admin@exampattern.ai",
  fullName: "Super Admin",
  roles: ["SUPER_ADMIN"],
  permissions: ["*"],
};

describe("Part 7: Full Pattern-Based Mock Test Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockExamVersion100 = {
    id: "ver-100",
    examId: "exam-1",
    year: 2026,
    versionName: "2026 Official",
    notificationNumber: "NOTIF-2026-01",
    exam: {
      id: "exam-1",
      name: "Civil Services Prelims",
      code: "CSP",
      slug: "civil-services-prelims",
      authority: "UPSC",
    },
    documents: [{ id: "doc-1", title: "Notification", documentType: "OFFICIAL_NOTIFICATION" }],
    blueprints: [
      {
        id: "bp-100",
        title: "Civil Services 100Q Pattern",
        totalQuestions: 100,
        totalMarks: 200 as unknown,
        durationMinutes: 120,
        negativeMarkingRate: 0.33 as unknown,
        sections: [
          {
            id: "bp-sec-1",
            name: "Section A (General Studies)",
            sectionOrder: 1,
            questionCount: 50,
            marksPerQuestion: 2,
            totalMarks: 100 as unknown,
            negativeRate: 0.33,
          },
          {
            id: "bp-sec-2",
            name: "Section B (Aptitude & Reasoning)",
            sectionOrder: 2,
            questionCount: 50,
            marksPerQuestion: 2,
            totalMarks: 100 as unknown,
            negativeRate: 0.33,
          },
        ],
      },
    ],
    syllabi: [
      {
        id: "syl-1",
        title: "CSP Syllabus",
        isVerified: true,
        sections: [
          {
            id: "syl-sec-1",
            name: "Section A (General Studies)",
            sortOrder: 1,
            topics: [
              { id: "top-1", name: "Indian Polity", sortOrder: 1 },
              { id: "top-2", name: "Indian Economy", sortOrder: 2 },
            ],
          },
          {
            id: "syl-sec-2",
            name: "Section B (Aptitude & Reasoning)",
            sortOrder: 2,
            topics: [
              { id: "top-3", name: "Data Interpretation", sortOrder: 1 },
              { id: "top-4", name: "Logical Reasoning", sortOrder: 2 },
            ],
          },
        ],
      },
    ],
  };

  it("1. should generate a plan where 100-question pattern produces exactly 100 questions across sections", async () => {
    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-100",
      examName: "Civil Services Prelims",
      versionName: "2026 Official",
      year: 2026,
      isReadyForMockGeneration: true,
      missingRequiredDocuments: [],
      blueprintReady: true,
      syllabusReady: true,
      requiredChecklist: [],
      optionalChecklist: [],
      referenceChecklist: [],
    });

    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue(mockExamVersion100 as any);
    vi.mocked(prisma.question.count).mockResolvedValue(60);

    const plan = await ActualPatternGeneratorService.buildGenerationPlan("ver-100");

    expect(plan.totalQuestions).toBe(100);
    expect(plan.durationMinutes).toBe(120);
    expect(plan.totalMarks).toBe(200);
    expect(plan.negativeMarkingRate).toBe(0.33);
    expect(plan.sections.length).toBe(2);

    expect(plan.sections[0].sectionName).toBe("Section A (General Studies)");
    expect(plan.sections[0].questionCount).toBe(50);
    expect(plan.sections[0].marksPerQuestion).toBe(2);

    expect(plan.sections[1].sectionName).toBe("Section B (Aptitude & Reasoning)");
    expect(plan.sections[1].questionCount).toBe(50);
    expect(plan.sections[1].marksPerQuestion).toBe(2);

    const sumQuestions = plan.sections.reduce((sum, s) => sum + s.questionCount, 0);
    expect(sumQuestions).toBe(100);
  });

  it("2. should dynamically support uneven sections (e.g. Section A: 100, Section B: 30, Section C: 20 -> 150Q / 180m)", async () => {
    const mock150 = {
      ...mockExamVersion100,
      blueprints: [
        {
          id: "bp-150",
          title: "150Q Engineering Pattern",
          totalQuestions: 150,
          totalMarks: 300 as unknown,
          durationMinutes: 180,
          negativeMarkingRate: 0.25 as unknown,
          sections: [
            { id: "s-1", name: "Core Technical", sectionOrder: 1, questionCount: 100, marksPerQuestion: 2, totalMarks: 200, negativeRate: 0.25 },
            { id: "s-2", name: "General Studies", sectionOrder: 2, questionCount: 30, marksPerQuestion: 2, totalMarks: 60, negativeRate: 0.25 },
            { id: "s-3", name: "Engineering Mathematics", sectionOrder: 3, questionCount: 20, marksPerQuestion: 2, totalMarks: 40, negativeRate: 0.25 },
          ],
        },
      ],
      syllabi: [
        {
          id: "syl-150",
          title: "Eng Syllabus",
          isVerified: true,
          sections: [
            { id: "ss-1", name: "Core Technical", sortOrder: 1, topics: [{ id: "t-1", name: "Circuits", sortOrder: 1 }] },
            { id: "ss-2", name: "General Studies", sortOrder: 2, topics: [{ id: "t-2", name: "Current Affairs", sortOrder: 1 }] },
            { id: "ss-3", name: "Engineering Mathematics", sortOrder: 3, topics: [{ id: "t-3", name: "Calculus", sortOrder: 1 }] },
          ],
        },
      ],
    };

    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-100",
      examName: "Eng Exam",
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

    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue(mock150 as any);
    vi.mocked(prisma.question.count).mockResolvedValue(50);

    const plan = await ActualPatternGeneratorService.buildGenerationPlan("ver-100");

    expect(plan.totalQuestions).toBe(150);
    expect(plan.durationMinutes).toBe(180);
    expect(plan.sections.length).toBe(3);
    expect(plan.sections[0].questionCount).toBe(100);
    expect(plan.sections[1].questionCount).toBe(30);
    expect(plan.sections[2].questionCount).toBe(20);
  });

  it("3. should prevent generation and show clear ValidationError when Question Bank is insufficient and AI generation is disabled", async () => {
    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-100",
      examName: "Civil Services",
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

    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue(mockExamVersion100 as any);
    // Question bank only has 36 questions per section (72 total)
    vi.mocked(prisma.question.count).mockResolvedValue(36);

    await expect(
      ActualPatternGeneratorService.generateActualPatternMock({
        examVersionId: "ver-100",
        generationMode: "FULL_PATTERN",
        generateMissingWithAi: false, // Explicitly disabled
        user: mockAdminUser,
      })
    ).rejects.toThrow(ValidationError);
  });

  it("4. should generate missing questions with AI and assemble 100% compliant full pattern mock test when generateMissingWithAi is enabled", async () => {
    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-100",
      examName: "Civil Services",
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

    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue(mockExamVersion100 as any);
    vi.mocked(prisma.mockTest.count).mockResolvedValue(0);
    vi.mocked(prisma.mockGenerationRequest.create).mockResolvedValue({ id: "req-1" } as any);
    vi.mocked(prisma.mockTest.create).mockResolvedValue({
      id: "mock-1",
      code: "CSP-2026-MOCK-001",
      totalQuestions: 100,
      durationMinutes: 120,
      generationType: "FULL_PATTERN_BASED",
    } as any);

    vi.mocked(prisma.mockTestSection.create)
      .mockResolvedValueOnce({ id: "msec-1", name: "Section A", questionCount: 50 } as any)
      .mockResolvedValueOnce({ id: "msec-2", name: "Section B", questionCount: 50 } as any);

    // Question bank has 0 questions -> all 50 per section generated via AI
    vi.mocked(prisma.question.findMany).mockResolvedValue([]);
    vi.mocked(prisma.question.create).mockResolvedValue({ id: "q-gen-1" } as any);
    vi.mocked(prisma.mockTestQuestion.create).mockResolvedValue({ id: "mq-1" } as any);

    vi.mocked(geminiQuestionService.generateQuestions).mockResolvedValue({
      questions: Array(25).fill(null).map((_, i) => ({
        questionText: `Generated Question ${i + 1}`,
        questionTextHindi: `उत्पन्न प्रश्न ${i + 1}`,
        explanation: "Valid explanation",
        difficulty: "MEDIUM",
        correctAnswer: "A",
        options: [
          { key: "A", text: "Option A", isCorrect: true },
          { key: "B", text: "Option B", isCorrect: false },
        ],
      })),
    } as any);

    vi.mocked(MockPatternValidatorService.validate).mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      checks: [
        { name: "Total Questions Match", passed: true, expected: 100, actual: 100 },
        { name: "Exam Duration Match", passed: true, expected: 120, actual: 120 },
      ],
    });

    vi.mocked(prisma.mockTest.update).mockResolvedValue({
      id: "mock-1",
      status: "PUBLISHED",
      totalQuestions: 100,
      durationMinutes: 120,
    } as any);

    const result = await ActualPatternGeneratorService.generateActualPatternMock({
      examVersionId: "ver-100",
      generationMode: "FULL_PATTERN",
      generateMissingWithAi: true,
      user: mockAdminUser,
    });

    expect(result.mockTest.id).toBe("mock-1");
    expect(result.validationReport.isValid).toBe(true);
    expect(prisma.mockTestQuestion.create).toHaveBeenCalled();
  });

  it("5. should support Quick / Partial mock test generation mode without forcing full 100 questions", async () => {
    vi.mocked(DocumentReadinessService.checkDocumentReadiness).mockResolvedValue({
      examVersionId: "ver-100",
      examName: "Civil Services",
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

    vi.mocked(prisma.examVersion.findUnique).mockResolvedValue(mockExamVersion100 as any);
    vi.mocked(prisma.mockTest.count).mockResolvedValue(1);
    vi.mocked(prisma.mockGenerationRequest.create).mockResolvedValue({ id: "req-2" } as any);
    vi.mocked(prisma.mockTest.create).mockResolvedValue({
      id: "mock-quick-1",
      code: "CSP-2026-MOCK-002",
      totalQuestions: 25,
      durationMinutes: 30,
      generationType: "QUICK_PARTIAL",
    } as any);

    vi.mocked(prisma.mockTestSection.create).mockResolvedValue({ id: "msec-q1" } as any);
    vi.mocked(prisma.question.findMany).mockResolvedValue([]);
    vi.mocked(geminiQuestionService.generateQuestions).mockResolvedValue({
      questions: [
        {
          questionText: "Sample Quick Question",
          explanation: "Quick explanation",
          difficulty: "EASY",
          correctAnswer: "A",
          options: [{ key: "A", text: "Opt A", isCorrect: true }],
        },
      ],
    } as any);

    vi.mocked(MockPatternValidatorService.validate).mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      checks: [],
    });

    vi.mocked(prisma.mockTest.update).mockResolvedValue({
      id: "mock-quick-1",
      status: "PUBLISHED",
      totalQuestions: 25,
      durationMinutes: 30,
    } as any);

    const result = await ActualPatternGeneratorService.generateActualPatternMock({
      examVersionId: "ver-100",
      generationMode: "QUICK",
      quickQuestionCount: 25,
      user: mockAdminUser,
    });

    expect(result.mockTest.id).toBe("mock-quick-1");
  });
});
