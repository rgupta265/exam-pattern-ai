import { z } from "zod";

export const documentTypeEnum = z.enum([
  "OFFICIAL_NOTIFICATION",
  "ADVERTISEMENT",
  "DETAILED_NOTIFICATION",
  "SYLLABUS",
  "EXAM_PATTERN",
  "BLUEPRINT",
  "INSTRUCTIONS",
  "PREVIOUS_YEAR_PAPER",
  "ANSWER_KEY",
  "AMENDMENT",
  "CORRIGENDUM",
  "ELIGIBILITY",
  "SYLLABUS_DOCUMENT",
  "REFERENCE_MATERIAL",
  "NOTIFICATION",
  "OTHER",
]);

export const uploadDocumentSchema = z.object({
  examVersionId: z.string().uuid("Invalid exam version ID"),
  documentType: documentTypeEnum,
  title: z.string().min(2, "Title is required").max(200),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
