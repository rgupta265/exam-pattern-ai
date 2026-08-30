import { z } from "zod";

export const generatedOptionSchema = z.object({
  key: z.string().min(1).max(5),
  text: z.string().min(1, "Option text cannot be empty"),
  textHindi: z.string().optional().nullable(),
  isCorrect: z.boolean().default(false),
});

export type GeneratedOption = z.infer<typeof generatedOptionSchema>;

export const generatedQuestionItemSchema = z.object({
  questionText: z.string().min(5, "Question text must have at least 5 characters"),
  questionTextHindi: z.string().optional().nullable(),
  questionType: z.string().default("SINGLE_CHOICE"),
  options: z.array(generatedOptionSchema).min(2, "At least 2 options required"),
  correctAnswer: z.string().min(1, "Correct answer key is required"),
  explanation: z.string().min(5, "Detailed explanation is required"),
  explanationHindi: z.string().optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  topicName: z.string().optional().nullable(),
  subtopic: z.string().optional().nullable(),
  marks: z.number().positive().default(1.0),
  negativeMarks: z.number().min(0).default(0.0),
  sourceType: z.string().optional().nullable(),
  sourceFileName: z.string().optional().nullable(),
  sourcePage: z.number().optional().nullable(),
  sourceTextSnippet: z.string().optional().nullable(),
  generationMode: z.string().optional().nullable(),
});

export type GeneratedQuestionItem = z.infer<typeof generatedQuestionItemSchema>;

export const generatedQuestionBatchSchema = z.object({
  questions: z.array(generatedQuestionItemSchema).min(1, "At least one question must be generated"),
});

export type GeneratedQuestionBatch = z.infer<typeof generatedQuestionBatchSchema>;
