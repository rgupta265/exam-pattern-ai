import { describe, it, expect } from "vitest";
import { BlueprintValidationService } from "@/services/blueprint/blueprint-validation.service";

describe("BlueprintValidationService", () => {
  it("should successfully validate a correct blueprint structure", () => {
    const report = BlueprintValidationService.validate({
      totalQuestions: 100,
      totalMarks: 100,
      durationMinutes: 120,
      hasNegativeMarking: true,
      negativeMarkingRate: 0.25,
      sections: [
        {
          name: "Section A: Domain Knowledge",
          sectionOrder: 1,
          questionCount: 80,
          marksPerQuestion: 1,
          totalMarks: 80,
          negativeRate: 0.25,
        },
        {
          name: "Section B: General Aptitude",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: 1,
          totalMarks: 20,
          negativeRate: 0.25,
        },
      ],
    });

    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.summary.calculatedQuestions).toBe(100);
    expect(report.summary.calculatedMarks).toBe(100);
  });

  it("should fail validation when sum of section questions does not equal total questions", () => {
    const report = BlueprintValidationService.validate({
      totalQuestions: 100,
      totalMarks: 100,
      durationMinutes: 120,
      hasNegativeMarking: false,
      negativeMarkingRate: 0,
      sections: [
        {
          name: "Section A",
          sectionOrder: 1,
          questionCount: 70, // 70 + 20 = 90 != 100
          marksPerQuestion: 1,
          totalMarks: 70,
          negativeRate: 0,
        },
        {
          name: "Section B",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: 1,
          totalMarks: 20,
          negativeRate: 0,
        },
      ],
    });

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("Sum of section questions (90) does not equal"))).toBe(true);
  });

  it("should fail validation when sum of section marks does not equal total marks", () => {
    const report = BlueprintValidationService.validate({
      totalQuestions: 100,
      totalMarks: 100,
      durationMinutes: 120,
      hasNegativeMarking: false,
      negativeMarkingRate: 0,
      sections: [
        {
          name: "Section A",
          sectionOrder: 1,
          questionCount: 80,
          marksPerQuestion: 1,
          totalMarks: 80,
          negativeRate: 0,
        },
        {
          name: "Section B",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: 1.5,
          totalMarks: 30, // 80 + 30 = 110 != 100
          negativeRate: 0,
        },
      ],
    });

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("Sum of section marks (110) does not equal"))).toBe(true);
  });

  it("should fail validation when individual section marks mismatch (questionCount * marksPerQuestion != totalMarks)", () => {
    const report = BlueprintValidationService.validate({
      totalQuestions: 100,
      totalMarks: 100,
      durationMinutes: 120,
      hasNegativeMarking: false,
      negativeMarkingRate: 0,
      sections: [
        {
          name: "Section A",
          sectionOrder: 1,
          questionCount: 80,
          marksPerQuestion: 1,
          totalMarks: 75, // 80 * 1 = 80 != 75
          negativeRate: 0,
        },
        {
          name: "Section B",
          sectionOrder: 2,
          questionCount: 20,
          marksPerQuestion: 1,
          totalMarks: 25, // 20 * 1 = 20 != 25
          negativeRate: 0,
        },
      ],
    });

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("Section marks mismatch"))).toBe(true);
  });

  it("should fail validation if negative marking rate is outside [0.0, 1.0]", () => {
    const report = BlueprintValidationService.validate({
      totalQuestions: 10,
      totalMarks: 10,
      durationMinutes: 30,
      hasNegativeMarking: true,
      negativeMarkingRate: 1.5, // Invalid > 1.0
      sections: [
        {
          name: "Section 1",
          sectionOrder: 1,
          questionCount: 10,
          marksPerQuestion: 1,
          totalMarks: 10,
          negativeRate: 1.5,
        },
      ],
    });

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("Negative marking rate must be between"))).toBe(true);
  });
});
