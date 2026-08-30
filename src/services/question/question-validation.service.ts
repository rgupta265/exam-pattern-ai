import { CreateQuestionInput } from "@/modules/question/schemas/question.schema";

export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
}

export class QuestionValidationService {
  /**
   * Normalizes question text for robust duplicate comparison
   */
  public static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Deterministic validation of question entity rules
   */
  public static validate(input: CreateQuestionInput): QuestionValidationResult {
    const errors: string[] = [];

    // 1. Question text
    if (!input.questionText || input.questionText.trim().length < 5) {
      errors.push("Question text must be at least 5 characters long.");
    }

    // 2. Options validation
    if (!input.options || input.options.length < 2) {
      errors.push("Question must contain at least 2 distinct options.");
    } else {
      const seenKeys = new Set<string>();
      const seenTexts = new Set<string>();
      let correctCount = 0;

      for (const opt of input.options) {
        const key = opt.optionKey.trim().toUpperCase();
        const textNorm = this.normalizeText(opt.optionText);

        if (!opt.optionText.trim()) {
          errors.push(`Option ${key} text cannot be empty.`);
        }

        if (seenKeys.has(key)) {
          errors.push(`Duplicate option key '${key}' detected.`);
        }
        seenKeys.add(key);

        if (seenTexts.has(textNorm)) {
          errors.push(`Duplicate option content detected for option '${key}'.`);
        }
        seenTexts.add(textNorm);

        if (opt.isCorrect) {
          correctCount++;
        }
      }

      if (input.questionType === "SINGLE_CHOICE" && correctCount !== 1) {
        errors.push(
          `Single choice question must have exactly ONE correct option. Found: ${correctCount}.`
        );
      }
    }

    // 3. Marks & Penalties
    if (input.marks !== undefined && input.marks <= 0) {
      errors.push("Marks awarded per question must be greater than 0.");
    }
    if (input.negativeMarks !== undefined && input.negativeMarks < 0) {
      errors.push("Negative marks penalty cannot be negative.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if question text is a duplicate of any existing question
   */
  public static isDuplicate(
    newQuestionText: string,
    existingQuestionTexts: string[]
  ): boolean {
    const normTarget = this.normalizeText(newQuestionText);
    for (const existing of existingQuestionTexts) {
      if (this.normalizeText(existing) === normTarget) {
        return true;
      }
    }
    return false;
  }
}
