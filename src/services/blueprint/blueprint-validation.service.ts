import { BlueprintSectionInput } from "@/modules/blueprint/schemas/blueprint.schema";

export interface BlueprintValidationTarget {
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  hasNegativeMarking: boolean;
  negativeMarkingRate: number;
  sections: BlueprintSectionInput[];
}

export interface BlueprintValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    calculatedQuestions: number;
    expectedQuestions: number;
    calculatedMarks: number;
    expectedMarks: number;
    sectionCount: number;
  };
}

export class BlueprintValidationService {
  /**
   * Validate blueprint structure against official examination mathematical and distribution rules
   */
  public static validate(target: BlueprintValidationTarget): BlueprintValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Basic Parameter Validations
    if (!target.totalQuestions || target.totalQuestions <= 0) {
      errors.push("Total questions must be a positive integer greater than 0.");
    }
    if (!target.totalMarks || target.totalMarks <= 0) {
      errors.push("Total marks must be greater than 0.");
    }
    if (!target.durationMinutes || target.durationMinutes <= 0) {
      errors.push("Exam duration must be greater than 0 minutes.");
    }
    if (target.hasNegativeMarking && (target.negativeMarkingRate < 0 || target.negativeMarkingRate > 1)) {
      errors.push("Negative marking rate must be between 0.0 and 1.0 (e.g. 0.25 for 1/4th penalty).");
    }
    if (!target.sections || target.sections.length === 0) {
      errors.push("Blueprint must define at least one examination section.");
    }

    // 2. Section Sum Validations
    let sumQuestions = 0;
    let sumMarks = 0;
    const seenOrders = new Set<number>();

    for (let i = 0; i < (target.sections || []).length; i++) {
      const sec = target.sections[i];
      const secLabel = `Section ${sec.sectionOrder || i + 1} (${sec.name || "Unnamed"})`;

      if (!sec.name || sec.name.trim().length === 0) {
        errors.push(`${secLabel}: Section name is required.`);
      }
      if (!sec.questionCount || sec.questionCount <= 0) {
        errors.push(`${secLabel}: Question count must be greater than 0.`);
      }
      if (!sec.marksPerQuestion || sec.marksPerQuestion <= 0) {
        errors.push(`${secLabel}: Marks per question must be greater than 0.`);
      }
      if (!sec.totalMarks || sec.totalMarks <= 0) {
        errors.push(`${secLabel}: Total marks must be greater than 0.`);
      }

      // Check section internal math: questionCount * marksPerQuestion ≈ totalMarks
      const expectedSecTotal = Number((sec.questionCount * sec.marksPerQuestion).toFixed(2));
      const actualSecTotal = Number(sec.totalMarks.toFixed(2));
      if (Math.abs(expectedSecTotal - actualSecTotal) > 0.01) {
        errors.push(
          `${secLabel}: Section marks mismatch. (${sec.questionCount} questions × ${sec.marksPerQuestion} marks = ${expectedSecTotal} marks, but section total is set to ${actualSecTotal}).`
        );
      }

      if (seenOrders.has(sec.sectionOrder)) {
        errors.push(`${secLabel}: Duplicate section order index '${sec.sectionOrder}'.`);
      }
      seenOrders.add(sec.sectionOrder);

      sumQuestions += sec.questionCount || 0;
      sumMarks += sec.totalMarks || 0;
    }

    // 3. Blueprint Aggregate Equality Checks
    sumQuestions = Math.round(sumQuestions);
    sumMarks = Number(sumMarks.toFixed(2));
    const targetMarks = Number(target.totalMarks.toFixed(2));

    if (sumQuestions !== target.totalQuestions) {
      errors.push(
        `Sum of section questions (${sumQuestions}) does not equal blueprint total questions (${target.totalQuestions}).`
      );
    }

    if (Math.abs(sumMarks - targetMarks) > 0.01) {
      errors.push(
        `Sum of section marks (${sumMarks}) does not equal blueprint total marks (${targetMarks}).`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        calculatedQuestions: sumQuestions,
        expectedQuestions: target.totalQuestions,
        calculatedMarks: sumMarks,
        expectedMarks: targetMarks,
        sectionCount: target.sections?.length || 0,
      },
    };
  }
}
