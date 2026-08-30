import { describe, it, expect } from "vitest";
import { DocumentAnalysisResultSchema } from "@/modules/ai/schemas/ai-extraction.schema";
import { GeminiDocumentService } from "@/services/ai/gemini-document.service";
import { GeminiProvider } from "@/services/ai/gemini.provider";

describe("Gemini Document Extraction & Zod Schema Validation", () => {
  it("should validate and parse a compliant Gemini extraction payload", () => {
    const validPayload = {
      examInfo: {
        examName: "UP Health Officer Examination",
        authority: "UP Medical Board",
        postName: "Community Health Officer",
        year: 2026,
        notificationNumber: "01/2026",
      },
      pattern: {
        title: "Official CHO Pattern",
        totalQuestions: 100,
        totalMarks: 100,
        durationMinutes: 120,
        hasNegativeMarking: true,
        negativeMarkingRate: 0.25,
        questionTypes: ["SINGLE_CHOICE"],
        languages: ["English", "Hindi"],
        instructions: "1 mark per question, 0.25 deduction for wrong answers",
        sourceTraceability: {
          documentName: "Notification.pdf",
          pageNumber: 5,
          excerpt: "Exam comprises 100 questions",
          isAmbiguous: false,
          confidenceScore: 0.99,
        },
      },
      sections: [
        {
          name: "Domain Health",
          sectionOrder: 1,
          questionCount: 80,
          marksPerQuestion: 1,
          totalMarks: 80,
          negativeRate: 0.25,
        },
        {
          name: "General Aptitude",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: 1,
          totalMarks: 20,
          negativeRate: 0.25,
        },
      ],
      rules: [
        {
          ruleType: "DIFFICULTY_RATIO",
          ruleConfig: { easy: 30, medium: 50, hard: 20 },
          description: "Difficulty split",
        },
      ],
      syllabus: [
        {
          name: "Clinical Knowledge",
          code: "CK-1",
          sortOrder: 1,
          topics: [
            {
              name: "Community Medicine",
              code: "CM-101",
              weightagePercentage: 40,
              sortOrder: 1,
              subtopics: ["Primary Health", "Immunization"],
            },
          ],
        },
      ],
      summaryNotes: "Valid notification",
      uncertainties: [],
    };

    const parsed = DocumentAnalysisResultSchema.parse(validPayload);
    expect(parsed.pattern.totalQuestions).toBe(100);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.syllabus).toHaveLength(1);
  });

  it("should fail validation when required pattern fields are missing or negative", () => {
    const invalidPayload = {
      examInfo: {
        examName: "UP Health Officer",
        authority: "Board",
        postName: "CHO",
        year: 2026,
      },
      pattern: {
        totalQuestions: -10, // Invalid negative
        totalMarks: 100,
        durationMinutes: 0, // Invalid 0 duration
        hasNegativeMarking: true,
      },
      sections: [], // Invalid empty sections
    };

    expect(() => DocumentAnalysisResultSchema.parse(invalidPayload)).toThrow();
  });

  it("GeminiDocumentService should return valid structured result from simulated provider in test mode", async () => {
    const provider = new GeminiProvider("test-gemini-key");
    const service = new GeminiDocumentService(provider);

    const result = await service.analyzeOfficialDocument({
      documentTitle: "UP-CHO-2026-Notification.pdf",
      documentType: "NOTIFICATION",
      rawTextContent: "Official Examination Notification for UP Health Officer 2026. 100 Questions, 100 Marks, 120 Minutes.",
      knownExamName: "UP Health Officer Examination",
      knownYear: 2026,
    });

    expect(result).toBeDefined();
    expect(result.examInfo.year).toBe(2026);
    expect(result.pattern.totalQuestions).toBe(100);
    expect(result.sections.length).toBeGreaterThanOrEqual(1);
  });
});
