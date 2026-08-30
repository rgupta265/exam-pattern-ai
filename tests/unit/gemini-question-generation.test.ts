import { describe, it, expect } from "vitest";
import { GeminiQuestionService } from "@/services/ai/gemini-question.service";
import { GeminiProvider } from "@/services/ai/gemini.provider";
import { generatedQuestionBatchSchema } from "@/modules/ai/schemas/ai-question-generation.schema";

describe("Gemini Question Generation & Zod Schema Validation", () => {
  it("should validate a structured question batch output", () => {
    const validBatch = {
      questions: [
        {
          questionText: "What is the recommended storage temperature for BCG vaccine in cold chain?",
          questionTextHindi: null,
          questionType: "SINGLE_CHOICE",
          options: [
            { key: "A", text: "+2°C to +8°C", isCorrect: true },
            { key: "B", text: "-15°C to -25°C", isCorrect: false },
            { key: "C", text: "+10°C to +15°C", isCorrect: false },
            { key: "D", text: "Room Temperature", isCorrect: false },
          ],
          correctAnswer: "A",
          explanation: "BCG vaccine must be maintained between +2°C and +8°C in standard Ice-Lined Refrigerators.",
          explanationHindi: null,
          difficulty: "MEDIUM",
          topicName: "Community Health Nursing",
          subtopic: "Immunization Protocols",
          marks: 1.0,
          negativeMarks: 0.25,
        },
      ],
    };

    const parsed = generatedQuestionBatchSchema.parse(validBatch);
    expect(parsed.questions).toHaveLength(1);
    expect(parsed.questions[0].correctAnswer).toBe("A");
    expect(parsed.questions[0].options).toHaveLength(4);
  });

  it("should generate simulated question batch in offline / test mode", async () => {
    const provider = new GeminiProvider("test-gemini-key");
    const service = new GeminiQuestionService(provider);

    const batch = await service.generateQuestions({
      examName: "UP Health Officer Examination",
      authority: "UP Medical Board",
      versionName: "2026 Regular",
      sectionName: "Clinical & Community Health",
      topicName: "Community Health Nursing",
      questionCount: 3,
      difficulty: "MEDIUM",
      marksPerQuestion: 1.0,
      negativeRate: 0.25,
    });

    expect(batch.questions).toHaveLength(3);
    batch.questions.forEach((q) => {
      expect(q.options).toHaveLength(4);
      expect(q.correctAnswer).toBeDefined();
      expect(q.marks).toBe(1.0);
      expect(q.negativeMarks).toBe(0.25);
    });
  });
});
