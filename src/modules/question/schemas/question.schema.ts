import { z } from "zod";

export const questionTypeEnum = z.enum([
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "NUMERICAL",
  "ASSERTION_REASON",
  "TRUE_FALSE",
  "MATCHING",
  "DESCRIPTIVE",
]);

export const difficultyLevelEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

export const questionStatusEnum = z.enum([
  "DRAFT",
  "AI_GENERATED",
  "AI_VALIDATED",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);

export const questionSourceEnum = z.enum([
  "MANUAL",
  "AI_GENERATED",
  "PREVIOUS_YEAR",
  "IMPORTED",
]);

export const questionOptionSchema = z.object({
  id: z.string().uuid().optional(),
  optionKey: z.string().min(1, "Option key is required (e.g. A, B, C, D)").max(10),
  optionText: z.string().min(1, "Option text is required"),
  optionTextHindi: z.string().optional().nullable(),
  isCorrect: z.boolean().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;

export const createQuestionSchema = z.object({
  topicId: z.string().uuid("Valid topic ID is required"),
  questionType: questionTypeEnum.optional().default("SINGLE_CHOICE"),
  difficulty: difficultyLevelEnum.optional().default("MEDIUM"),
  status: questionStatusEnum.optional().default("DRAFT"),
  questionText: z.string().min(5, "Question text must be at least 5 characters"),
  questionTextHindi: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  explanationHindi: z.string().optional().nullable(),
  subtopic: z.string().optional().nullable(),
  marks: z.number().positive("Marks must be positive").optional().default(1.0),
  negativeMarks: z.number().min(0, "Negative marks cannot be negative").optional().default(0.0),
  source: questionSourceEnum.optional().default("MANUAL"),
  sourceReference: z.string().optional().nullable(),
  isPreviousYear: z.boolean().optional().default(false),
  pyqYear: z.number().int().min(1990).max(2050).optional().nullable(),
  options: z.array(questionOptionSchema).min(2, "At least 2 options are required for objective questions"),
});

export type CreateQuestionInput = z.input<typeof createQuestionSchema>;
export type CreateQuestionOutput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = createQuestionSchema.partial();

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

export const questionFilterSchema = z.object({
  topicId: z.string().optional(),
  sectionId: z.string().optional(),
  examVersionId: z.string().optional(),
  difficulty: difficultyLevelEnum.optional(),
  status: questionStatusEnum.optional(),
  source: questionSourceEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().default(1),
  pageSize: z.coerce.number().int().default(15),
});

export type QuestionFilterParams = z.infer<typeof questionFilterSchema>;

export const questionReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]),
  feedback: z.string().optional().nullable(),
});

export type QuestionReviewInput = z.infer<typeof questionReviewSchema>;
