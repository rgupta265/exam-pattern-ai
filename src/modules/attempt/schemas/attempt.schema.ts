import { z } from "zod";

export const createAttemptSchema = z.object({
  mockTestId: z.string().uuid("Invalid mock test ID"),
});

export type CreateAttemptInput = z.infer<typeof createAttemptSchema>;

export const autosaveAnswerSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  selectedOptionId: z.string().uuid().nullable().optional(),
  numericalAnswer: z.number().nullable().optional(),
  isMarkedForReview: z.boolean().optional(),
  isVisited: z.boolean().optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export type AutosaveAnswerInput = z.infer<typeof autosaveAnswerSchema>;

export const attemptEventSchema = z.object({
  eventType: z.enum([
    "START",
    "QUESTION_VIEWED",
    "SELECT_ANSWER",
    "CHANGE_ANSWER",
    "CLEAR_ANSWER",
    "MARK_REVIEW",
    "UNMARK_REVIEW",
    "SWITCH_SECTION",
    "PAUSE",
    "RESUME",
    "HEARTBEAT",
    "SUBMIT",
    "AUTO_SUBMIT",
  ]),
  eventData: z.record(z.any()).optional().nullable(),
  timeOffsetMs: z.number().int().min(0).default(0),
});

export type AttemptEventInput = z.infer<typeof attemptEventSchema>;
