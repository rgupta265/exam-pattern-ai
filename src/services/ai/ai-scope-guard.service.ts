import { AIContext, AITaskType } from "./ai-context";
import { BadRequestError } from "@/lib/errors";

export interface ScopeValidationResult {
  isValid: boolean;
  reason?: string;
}

export class AIScopeGuard {
  private static readonly MAX_QUESTIONS_PER_BATCH = 100;
  private static readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 30;
  private static readonly userRequestCounts = new Map<string, { count: number; windowStart: number }>();

  /**
   * Enforces strict scope boundaries on all AI generation and analysis requests
   */
  public static validate(context: AIContext): ScopeValidationResult {
    // 1. Verify Task Type
    const validTaskTypes: AITaskType[] = [
      "DOCUMENT_ANALYSIS",
      "EXAM_PATTERN_EXTRACTION",
      "SYLLABUS_EXTRACTION",
      "QUESTION_GENERATION",
      "QUESTION_VALIDATION",
      "MOCK_GENERATION",
      "MOCK_VALIDATION",
      "PERFORMANCE_ANALYSIS",
      "QUESTION_EXPLANATION",
      "TRANSLATION",
      "SOURCE_RELEVANCE_CHECK",
      "AI_SUGGESTIONS",
    ];

    if (!validTaskTypes.includes(context.taskType)) {
      return {
        isValid: false,
        reason: `Unsupported AI task type: ${context.taskType}. General chat is disallowed.`,
      };
    }

    // 2. Question Generation Scope Verification
    if (context.taskType === "QUESTION_GENERATION" || context.taskType === "MOCK_GENERATION") {
      // Validate requested question count
      if (
        context.requestedQuestionCount !== undefined &&
        (context.requestedQuestionCount <= 0 || context.requestedQuestionCount > this.MAX_QUESTIONS_PER_BATCH)
      ) {
        return {
          isValid: false,
          reason: `Requested question count must be between 1 and ${this.MAX_QUESTIONS_PER_BATCH}.`,
        };
      }

      // Validate Topic against verified syllabus
      if (context.requestedTopic && context.allowedTopics.length > 0) {
        const normalizedRequested = context.requestedTopic.trim().toLowerCase();
        const matchesSyllabus = context.allowedTopics.some((t) => {
          const norm = t.trim().toLowerCase();
          return norm === normalizedRequested || norm.includes(normalizedRequested) || normalizedRequested.includes(norm);
        });

        if (!matchesSyllabus) {
          return {
            isValid: false,
            reason: `Topic "${context.requestedTopic}" is outside the scope of the verified exam syllabus.`,
          };
        }
      }

      // Source-Only Mode Validation
      if (context.generationMode === "SOURCE_ONLY") {
        if (!context.sourceMaterial || context.sourceMaterial.trim().length < 20) {
          return {
            isValid: false,
            reason: "Source-Only generation requires sufficient uploaded source material text (min 20 characters).",
          };
        }
      }
    }

    // 3. Source Relevance Pre-check
    if (context.sourceMaterial && context.allowedTopics.length > 0) {
      const relevance = this.checkSourceRelevance(context.sourceMaterial, context.allowedTopics);
      if (!relevance.isRelevant && context.generationMode === "SOURCE_ONLY") {
        return {
          isValid: false,
          reason: `Uploaded source content does not match any topics in the verified syllabus (${context.allowedTopics.slice(0, 3).join(", ")}...).`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Verifies whether uploaded source material overlaps with syllabus topics
   */
  public static checkSourceRelevance(
    sourceText: string,
    syllabusTopics: string[]
  ): { isRelevant: boolean; matchedTopics: string[] } {
    if (!sourceText || syllabusTopics.length === 0) {
      return { isRelevant: true, matchedTopics: [] };
    }

    const normalizedText = sourceText.toLowerCase();
    const matchedTopics = syllabusTopics.filter((topic) => {
      const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      return words.some((w) => normalizedText.includes(w));
    });

    return {
      isRelevant: matchedTopics.length > 0 || sourceText.length > 100,
      matchedTopics,
    };
  }

  /**
   * Enforces user request rate limits to protect Gemini quota
   */
  public static checkRateLimit(userId: string): void {
    const now = Date.now();
    const record = this.userRequestCounts.get(userId);

    if (!record || now - record.windowStart > this.RATE_LIMIT_WINDOW_MS) {
      this.userRequestCounts.set(userId, { count: 1, windowStart: now });
      return;
    }

    if (record.count >= this.MAX_REQUESTS_PER_WINDOW) {
      throw new BadRequestError("AI rate limit exceeded. Please wait a minute before making another request.");
    }

    record.count++;
  }
}
