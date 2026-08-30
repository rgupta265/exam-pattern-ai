import { describe, it, expect } from "vitest";
import { AIScopeGuard } from "@/services/ai/ai-scope-guard.service";
import { AIContext } from "@/services/ai/ai-context";

describe("AIScopeGuard Unit Tests", () => {
  it("should allow valid question generation within verified syllabus", () => {
    const context: AIContext = {
      taskType: "QUESTION_GENERATION",
      examId: "exam-1",
      examName: "UP Health Officer",
      allowedTopics: ["Community Health Nursing", "Anatomy", "Epidemiology"],
      allowedQuestionTypes: ["SINGLE_CHOICE"],
      allowedLanguages: ["English", "Hindi"],
      requestedTopic: "Anatomy",
      requestedQuestionCount: 10,
      generationMode: "EXAM_CONTEXT_ASSISTED",
    };

    const result = AIScopeGuard.validate(context);
    expect(result.isValid).toBe(true);
  });

  it("should reject out-of-scope topic requests not present in verified syllabus", () => {
    const context: AIContext = {
      taskType: "QUESTION_GENERATION",
      examId: "exam-1",
      examName: "UP Health Officer",
      allowedTopics: ["Community Health Nursing", "Anatomy", "Epidemiology"],
      allowedQuestionTypes: ["SINGLE_CHOICE"],
      allowedLanguages: ["English", "Hindi"],
      requestedTopic: "Cricket World Cup History", // OUT OF SCOPE
      requestedQuestionCount: 5,
      generationMode: "EXAM_CONTEXT_ASSISTED",
    };

    const result = AIScopeGuard.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("outside the scope of the verified exam syllabus");
  });

  it("should reject invalid general chat or unsupported AI tasks", () => {
    const context: any = {
      taskType: "GENERAL_CHAT",
      allowedTopics: [],
      allowedQuestionTypes: [],
      allowedLanguages: [],
    };

    const result = AIScopeGuard.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("General chat is disallowed");
  });

  it("should enforce question batch count limit (<= 100)", () => {
    const context: AIContext = {
      taskType: "QUESTION_GENERATION",
      allowedTopics: ["Anatomy"],
      allowedQuestionTypes: ["SINGLE_CHOICE"],
      allowedLanguages: ["English"],
      requestedTopic: "Anatomy",
      requestedQuestionCount: 250, // Exceeds 100 limit
    };

    const result = AIScopeGuard.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("between 1 and 100");
  });

  it("should correctly check source relevance against syllabus", () => {
    const syllabus = ["Maternal Care", "Immunization", "Pharmacology"];
    const relevantText = "The immunization schedule requires routine vaccination at birth and 6 weeks.";
    const irrelevantText = "The final score of the cricket tournament was 280 runs.";

    const check1 = AIScopeGuard.checkSourceRelevance(relevantText, syllabus);
    expect(check1.isRelevant).toBe(true);
    expect(check1.matchedTopics).toContain("Immunization");

    const check2 = AIScopeGuard.checkSourceRelevance(irrelevantText, syllabus);
    expect(check2.matchedTopics.length).toBe(0);
  });
});
