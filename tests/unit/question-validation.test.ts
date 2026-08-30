import { describe, it, expect } from "vitest";
import { QuestionValidationService } from "@/services/question/question-validation.service";

describe("QuestionValidationService", () => {
  it("should validate a compliant question with 4 options and one correct answer", () => {
    const result = QuestionValidationService.validate({
      topicId: "topic-1",
      questionType: "SINGLE_CHOICE",
      difficulty: "MEDIUM",
      status: "APPROVED",
      questionText: "What is the primary objective of community health nursing?",
      marks: 1,
      negativeMarks: 0.25,
      source: "MANUAL",
      options: [
        { optionKey: "A", optionText: "Curative care only", isCorrect: false, sortOrder: 0 },
        { optionKey: "B", optionText: "Primary prevention and public health", isCorrect: true, sortOrder: 1 },
        { optionKey: "C", optionText: "Hospital administration", isCorrect: false, sortOrder: 2 },
        { optionKey: "D", optionText: "Surgical intervention", isCorrect: false, sortOrder: 3 },
      ],
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation if there is no correct option marked for single choice question", () => {
    const result = QuestionValidationService.validate({
      topicId: "topic-1",
      questionType: "SINGLE_CHOICE",
      difficulty: "MEDIUM",
      status: "DRAFT",
      questionText: "What is the standard immunization schedule?",
      marks: 1,
      negativeMarks: 0,
      source: "MANUAL",
      options: [
        { optionKey: "A", optionText: "Schedule 1", isCorrect: false, sortOrder: 0 },
        { optionKey: "B", optionText: "Schedule 2", isCorrect: false, sortOrder: 1 },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("exactly ONE correct option"))).toBe(true);
  });

  it("should fail validation if duplicate option texts exist", () => {
    const result = QuestionValidationService.validate({
      topicId: "topic-1",
      questionType: "SINGLE_CHOICE",
      difficulty: "EASY",
      status: "DRAFT",
      questionText: "Which vitamin is synthesized in skin via sunlight?",
      marks: 1,
      negativeMarks: 0.25,
      source: "MANUAL",
      options: [
        { optionKey: "A", optionText: "Vitamin D", isCorrect: true, sortOrder: 0 },
        { optionKey: "B", optionText: "Vitamin D", isCorrect: false, sortOrder: 1 }, // Duplicate text
        { optionKey: "C", optionText: "Vitamin C", isCorrect: false, sortOrder: 2 },
        { optionKey: "D", optionText: "Vitamin A", isCorrect: false, sortOrder: 3 },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate option content"))).toBe(true);
  });

  it("should detect duplicate questions using normalized text comparison", () => {
    const existing = [
      "What is the capital of Uttar Pradesh?",
      "Which organ secretes insulin in human body?",
    ];

    expect(
      QuestionValidationService.isDuplicate(
        "which organ secretes insulin in human body?",
        existing
      )
    ).toBe(true);

    expect(
      QuestionValidationService.isDuplicate(
        "Which hormone is secreted by adrenal gland?",
        existing
      )
    ).toBe(false);
  });
});
