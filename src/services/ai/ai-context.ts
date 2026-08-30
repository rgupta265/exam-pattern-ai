export type AITaskType =
  | "DOCUMENT_ANALYSIS"
  | "EXAM_PATTERN_EXTRACTION"
  | "SYLLABUS_EXTRACTION"
  | "QUESTION_GENERATION"
  | "QUESTION_VALIDATION"
  | "MOCK_GENERATION"
  | "MOCK_VALIDATION"
  | "PERFORMANCE_ANALYSIS"
  | "QUESTION_EXPLANATION"
  | "TRANSLATION"
  | "SOURCE_RELEVANCE_CHECK"
  | "AI_SUGGESTIONS";

export interface AIContext {
  taskType: AITaskType;
  examId?: string;
  examVersionId?: string;
  examName?: string;
  authority?: string;
  blueprintId?: string;
  totalQuestions?: number;
  totalMarks?: number;
  durationMinutes?: number;
  negativeMarkingRate?: number;
  allowedTopics: string[];
  allowedQuestionTypes: string[];
  allowedLanguages: string[];
  requestedTopic?: string;
  requestedDifficulty?: string;
  requestedQuestionCount?: number;
  sourceMaterial?: string;
  sourceType?: "PDF" | "DOCX" | "IMAGE" | "TEXT" | "MANUAL";
  generationMode?: "SOURCE_ONLY" | "EXAM_CONTEXT_ASSISTED";
}
