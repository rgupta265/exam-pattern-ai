# Question Bank & Review Workflow Architecture

## Data Models

- **Question (`questions`)**:
  - `questionText`, `questionTextHindi`, `explanation`, `explanationHindi`, `subtopic`, `marks`, `negativeMarks`
  - `questionType`: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `NUMERICAL`, `ASSERTION_REASON`, `TRUE_FALSE`, `MATCHING`, `DESCRIPTIVE`
  - `difficulty`: `EASY`, `MEDIUM`, `HARD`
  - `status`: `DRAFT`, `AI_GENERATED`, `AI_VALIDATED`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`
  - `source`: `MANUAL`, `AI_GENERATED`, `PREVIOUS_YEAR`, `IMPORTED`
  - `isAiGenerated`, `isAiValidated`, `isHumanVerified`
  - Foreign key: `topicId` $\rightarrow$ `SyllabusTopic`
- **QuestionOption (`question_options`)**:
  - `optionKey` ("A", "B", "C", "D"), `optionText`, `optionTextHindi`, `isCorrect`, `sortOrder`
- **QuestionReview (`question_reviews`)**:
  - `reviewerId`, `decision` (`APPROVED`, `REJECTED`, `NEEDS_REVISION`), `feedback`, `reviewedAt`
- **QuestionAiGeneration (`question_ai_generations`)**:
  - `promptUsed`, `modelName`, `rawResponse`, `tokensUsed`, `validationStatus`

---

## Question Lifecycle State Machine

```
DRAFT / AI_GENERATED ──► AI_VALIDATED ──► PENDING_REVIEW ──► APPROVED (Human Verified)
                                                  └──► REJECTED
```

---

## Review Queue

Reviewers and Admins access `/admin/question-reviews` to inspect:
- Question stem and options
- Correct answer and explanation
- Mapped syllabus topic and difficulty
- Trigger one-click approval, rejection, or revision requests.
