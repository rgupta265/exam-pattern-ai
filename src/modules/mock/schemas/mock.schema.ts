import { z } from "zod";

export const mockTestTypeEnum = z.enum([
  "FULL_MOCK",
  "TOPIC_PRACTICE",
  "SECTIONAL_MOCK",
  "PREVIOUS_YEAR",
  "AI_PRACTICE",
]);

export const mockPublishStatusEnum = z.enum([
  "DRAFT",
  "GENERATING",
  "VALIDATED",
  "VALIDATION_FAILED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const mockGenerationModeEnum = z.enum(["FULL_PATTERN", "QUICK"]);
export type MockGenerationMode = z.infer<typeof mockGenerationModeEnum>;

export const generateFullMockRequestSchema = z.object({
  type: z.literal("FULL_MOCK").optional(),
  examVersionId: z.string().uuid("Invalid exam version ID"),
  blueprintId: z.string().uuid().optional(),
  title: z.string().optional(),
  generationMode: mockGenerationModeEnum.default("FULL_PATTERN"),
  generateMissingWithAi: z.boolean().default(true),
  quickQuestionCount: z.number().int().min(5).max(200).optional(),
});

export type GenerateFullMockRequestInput = z.infer<typeof generateFullMockRequestSchema>;

export const patternSummaryQuerySchema = z.object({
  examVersionId: z.string().uuid("Invalid exam version ID"),
  blueprintId: z.string().uuid().optional(),
});

export type PatternSummaryQueryInput = z.infer<typeof patternSummaryQuerySchema>;

export const generateTopicMockRequestSchema = z.object({
  type: z.literal("TOPIC_PRACTICE").optional(),
  examVersionId: z.string().uuid("Invalid exam version ID"),
  topicId: z.string().uuid("Invalid topic ID"),
  questionCount: z.number().int().min(5, "Minimum 5 questions").max(100, "Maximum 100 questions").default(20),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  language: z.enum(["English", "Hindi"]).default("English"),
  title: z.string().optional(),
});

export type GenerateTopicMockRequestInput = z.infer<typeof generateTopicMockRequestSchema>;

export const publishMockSchema = z.object({
  status: z.enum(["PUBLISHED", "ARCHIVED"]),
});

export type PublishMockInput = z.infer<typeof publishMockSchema>;

export const mockFilterSchema = z.object({
  examVersionId: z.string().optional(),
  type: mockTestTypeEnum.optional(),
  status: mockPublishStatusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().default(1),
  pageSize: z.coerce.number().int().default(10),
  isCandidateFacing: z.boolean().optional(),
});

export type MockFilterParams = z.infer<typeof mockFilterSchema>;
