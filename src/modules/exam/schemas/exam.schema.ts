import { z } from "zod";

export const examCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export type ExamCategoryInput = z.infer<typeof examCategorySchema>;

export const examSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID"),
  name: z.string().min(2, "Exam name must be at least 2 characters").max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  code: z.string().min(2).max(50).toUpperCase(),
  authority: z.string().min(2, "Authority name is required").max(150),
  postName: z.string().min(2, "Post designation is required").max(150),
  description: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export type ExamInput = z.infer<typeof examSchema>;

export const examVersionSchema = z.object({
  examId: z.string().uuid("Invalid exam ID"),
  year: z.number().int().min(2000).max(2050),
  versionName: z.string().min(1, "Version name is required").max(100),
  notificationNumber: z.string().optional(),
  status: z.enum(["DRAFT", "PROCESSING", "UNDER_REVIEW", "VERIFIED", "ACTIVE", "ARCHIVED"]).optional().default("DRAFT"),
  effectiveDate: z.string().datetime().optional().nullable(),
  description: z.string().optional(),
});

export type ExamVersionInput = z.infer<typeof examVersionSchema>;

export const examFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  authority: z.string().optional(),
  postName: z.string().optional(),
  year: z.coerce.number().int().optional(),
  page: z.coerce.number().int().default(1),
  pageSize: z.coerce.number().int().default(10),
  isCandidateFacing: z.boolean().optional(),
});

export type ExamFilterParams = z.infer<typeof examFilterSchema>;
