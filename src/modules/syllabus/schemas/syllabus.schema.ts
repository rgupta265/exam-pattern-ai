import { z } from "zod";

export const syllabusTopicSchema = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  name: z.string().min(1, "Topic name is required").max(200),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  weightagePercentage: z.number().min(0).max(100).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export type SyllabusTopicInput = z.infer<typeof syllabusTopicSchema>;

export const syllabusSectionSchema = z.object({
  id: z.string().uuid().optional(),
  syllabusId: z.string().uuid().optional(),
  name: z.string().min(1, "Section name is required").max(200),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  topics: z.array(syllabusTopicSchema).default([]),
});

export type SyllabusSectionInput = z.infer<typeof syllabusSectionSchema>;

export const createSyllabusSchema = z.object({
  examVersionId: z.string().uuid("Invalid exam version ID"),
  title: z.string().min(2, "Syllabus title is required").max(200),
  sections: z.array(syllabusSectionSchema).default([]),
});

export type CreateSyllabusInput = z.infer<typeof createSyllabusSchema>;
