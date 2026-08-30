import { z } from "zod";

export const resultFilterSchema = z.object({
  examId: z.string().optional(),
  mockTestId: z.string().optional(),
  page: z.coerce.number().int().default(1),
  pageSize: z.coerce.number().int().default(10),
});

export type ResultFilterParams = z.infer<typeof resultFilterSchema>;

export const questionReviewFilterSchema = z.object({
  status: z.enum(["ALL", "CORRECT", "INCORRECT", "UNANSWERED", "MARKED"]).default("ALL"),
  sectionId: z.string().optional(),
  page: z.coerce.number().int().default(1),
  pageSize: z.coerce.number().int().default(20),
});

export type QuestionReviewFilterParams = z.infer<typeof questionReviewFilterSchema>;
