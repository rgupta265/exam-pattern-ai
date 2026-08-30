import { z } from "zod";

export const blueprintSectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Section name is required"),
  sectionOrder: z.number().int().min(1),
  questionCount: z.number().int().min(1, "Question count must be at least 1"),
  marksPerQuestion: z.number().positive("Marks per question must be positive"),
  totalMarks: z.number().positive("Total section marks must be positive"),
  negativeRate: z.number().min(0).max(1).default(0),
  instructions: z.string().optional().nullable(),
});

export type BlueprintSectionInput = z.infer<typeof blueprintSectionSchema>;

export const blueprintRuleSchema = z.object({
  id: z.string().uuid().optional(),
  ruleType: z.string().min(1, "Rule type is required"),
  ruleConfig: z.record(z.unknown()),
  description: z.string().optional().nullable(),
});

export type BlueprintRuleInput = z.infer<typeof blueprintRuleSchema>;

export const updateBlueprintSchema = z.object({
  title: z.string().min(2, "Blueprint title is required").max(200),
  totalQuestions: z.number().int().min(1),
  totalMarks: z.number().positive(),
  durationMinutes: z.number().int().min(1),
  hasNegativeMarking: z.boolean(),
  negativeMarkingRate: z.number().min(0).max(1).default(0),
  instructions: z.string().optional().nullable(),
  sections: z.array(blueprintSectionSchema).min(1, "At least one section is required"),
  rules: z.array(blueprintRuleSchema).optional().default([]),
});

export type UpdateBlueprintInput = z.infer<typeof updateBlueprintSchema>;

export const createBlueprintDraftSchema = z.object({
  examVersionId: z.string().uuid("Invalid exam version ID"),
  title: z.string().min(2).max(200),
  totalQuestions: z.number().int().min(1),
  totalMarks: z.number().positive(),
  durationMinutes: z.number().int().min(1),
  hasNegativeMarking: z.boolean().default(false),
  negativeMarkingRate: z.number().min(0).max(1).default(0),
  instructions: z.string().optional().nullable(),
  sections: z.array(blueprintSectionSchema).min(1),
  rules: z.array(blueprintRuleSchema).optional().default([]),
});

export type CreateBlueprintDraftInput = z.infer<typeof createBlueprintDraftSchema>;
