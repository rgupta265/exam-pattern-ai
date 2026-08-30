# Pattern Validation Engine

## Objective

The **Pattern Validation Engine** (`MockPatternValidatorService`) provides deterministic, automated verification ensuring that every generated full-pattern mock test adheres 100% to the official locked exam blueprint before publication.

---

## Validation Checks Checklist

- [x] **Total Question Count Match:** $\sum (\text{Section Questions}) == \text{Blueprint.totalQuestions}$
- [x] **Section-by-Section Distribution:** Question count per section matches blueprint section specifications.
- [x] **Total Aggregate Marks Match:** $\sum (\text{Question Marks}) == \text{Blueprint.totalMarks}$
- [x] **Exam Duration Match:** Duration in minutes matches blueprint.
- [x] **Negative Marking Penalty Match:** Section negative penalty rates match blueprint configurations.
- [x] **100% Syllabus Alignment:** Every single question maps to a valid, active syllabus node belonging to the exam version.
- [x] **Zero Duplicate Questions:** Rigorous exact & normalized text matching prevents duplicate questions in the same mock.

---

## Output & Audit Artifact

Every run creates a permanent `MockValidationResult` record with a detailed score report containing:
- Individual check status (`passed: boolean`)
- Expected vs. Actual values
- Error and warning summaries.

If validation fails, the mock test status is set to `VALIDATION_FAILED` and is prevented from candidate publication.
