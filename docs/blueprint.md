# Exam Blueprint & Validation Engine

## Core Principle

The **Exam Blueprint** is the definitive, authoritative source of truth for all full-pattern mock test generation in ExamPattern AI. AI is never the final authority on exam patterns; an authorized administrator must verify and lock the blueprint.

---

## State Machine Lifecycle

```
DRAFT ──► AI_ANALYZED ──► UNDER_REVIEW ──► VERIFIED ──► LOCKED ──► ACTIVE
```

1. **DRAFT / AI_ANALYZED:**
   - Automatically generated from Gemini AI extraction of official notification documents.
2. **UNDER_REVIEW:**
   - Administrator reviews, corrects, and edits sectional parameters, question marks, and instructions.
3. **VERIFIED:**
   - Passed 100% of the mathematical validation engine checks and approved by an authorized administrator.
4. **LOCKED:**
   - **Immutable state.** The blueprint is permanently locked (`lockedById`, `lockedAt`). Direct modifications are strictly forbidden by `BlueprintService.updateBlueprint`.
5. **ACTIVE:**
   - Enabled for candidate discovery and full-pattern mock test generation.

---

## Corrigendum Handling

When an official corrigendum or amendment is released:
- The existing locked blueprint is **never mutated** or overwritten.
- An administrator calls `BlueprintService.createCorrigendumBlueprint(lockedBlueprintId, title)`.
- A new version draft (`versionNumber + 1`) is spawned, preserving historical pattern records.

---

## Mathematical Validation Engine Checks

The `BlueprintValidationService` validates:
- `SUM(sections.questionCount) == blueprint.totalQuestions`
- `SUM(sections.totalMarks) == blueprint.totalMarks`
- For each section: `questionCount * marksPerQuestion == totalMarks`
- `durationMinutes > 0`, `totalQuestions > 0`, `totalMarks > 0`
- `0.0 <= negativeMarkingRate <= 1.0`
- Sequential section orders without duplicates.
