import { z } from "zod";

export const SourceTraceabilitySchema = z.object({
  documentName: z.string().optional(),
  pageNumber: z.number().int().optional().nullable(),
  excerpt: z.string().optional(),
  isAmbiguous: z.boolean().default(false),
  confidenceScore: z.number().min(0).max(1).default(1),
  adminReviewNote: z.string().optional().nullable(),
});

export const ExtractedSectionSchema = z.object({
  name: z.string().min(1),
  sectionOrder: z.number().int().min(1),
  questionCount: z.number().int().min(1),
  marksPerQuestion: z.number().positive(),
  totalMarks: z.number().positive(),
  negativeRate: z.number().min(0).max(1).default(0),
  instructions: z.string().optional().nullable(),
  sourceTraceability: SourceTraceabilitySchema.optional(),
});

export type ExtractedSection = z.infer<typeof ExtractedSectionSchema>;

export const ExtractedRuleSchema = z.object({
  ruleType: z.string().min(1),
  ruleConfig: z.record(z.unknown()),
  description: z.string().optional(),
  sourceTraceability: SourceTraceabilitySchema.optional(),
});

export type ExtractedRule = z.infer<typeof ExtractedRuleSchema>;

export const ExtractedTopicSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  weightagePercentage: z.number().min(0).max(100).optional().nullable(),
  sortOrder: z.number().int().default(0),
  subtopics: z.array(z.string()).default([]),
  sourceTraceability: SourceTraceabilitySchema.optional(),
});

export type ExtractedTopic = z.infer<typeof ExtractedTopicSchema>;

export const ExtractedSyllabusSectionSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  topics: z.array(ExtractedTopicSchema).default([]),
});

export type ExtractedSyllabusSection = z.infer<typeof ExtractedSyllabusSectionSchema>;

export const DocumentAnalysisResultSchema = z.object({
  examInfo: z.object({
    examName: z.string().min(1),
    authority: z.string().min(1),
    postName: z.string().min(1),
    year: z.number().int().min(2000).max(2050),
    notificationNumber: z.string().optional().nullable(),
  }),
  pattern: z.object({
    title: z.string().default("Official Exam Pattern"),
    totalQuestions: z.number().int().min(1),
    totalMarks: z.number().positive(),
    durationMinutes: z.number().int().min(1),
    hasNegativeMarking: z.boolean(),
    negativeMarkingRate: z.number().min(0).max(1).default(0),
    questionTypes: z.array(z.string()).default(["SINGLE_CHOICE"]),
    languages: z.array(z.string()).default(["English"]),
    instructions: z.string().optional().nullable(),
    sourceTraceability: SourceTraceabilitySchema.optional(),
  }),
  sections: z.array(ExtractedSectionSchema).min(1, "At least one section must be extracted"),
  rules: z.array(ExtractedRuleSchema).default([]),
  syllabus: z.array(ExtractedSyllabusSectionSchema).default([]),
  summaryNotes: z.string().optional(),
  uncertainties: z.array(z.string()).default([]),
});

export type DocumentAnalysisResult = z.infer<typeof DocumentAnalysisResultSchema>;
