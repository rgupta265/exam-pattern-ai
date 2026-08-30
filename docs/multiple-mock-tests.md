# Multiple Independent Mock Tests & Tracking Architecture

## 1. Overview
In ExamPattern AI, every **Exam Version** supports an unlimited sequence of independent mock tests (e.g. Mock 1, Mock 2, Mock 3...).

```
Exam: UP Health Officer (2026 Regular)
 ├── UPHO-2026-MOCK-001 (Full Blueprint Mock 1)
 ├── UPHO-2026-MOCK-002 (Full Blueprint Mock 2)
 ├── UPHO-2026-MOCK-003 (Full Blueprint Mock 3)
 └── UPHO-2026-TOPIC-001 (Community Health Nursing Drill)
```

## 2. Unique Tracking Identifiers
Every mock test receives:
* An internal immutable UUID: `id` (e.g., `c9bf9e57-1685-4c89-bafb-ff5af830be8a`).
* A human-readable unique public code: `code` (e.g., `UPHO-2026-MOCK-001`).

Formula:
`${EXAM_CODE}-${YEAR}-${TYPE_PREFIX}-${SEQUENCE_3_DIGITS}`

## 3. Independent Lifecycle & Tenant Isolation
* **Independent Question Sets:** Each mock has its own ordered `mock_test_questions` mapping.
* **Isolated Attempts:** Candidate attempts reference specific `mockTestId`. Attempting Mock 1 does not alter Mock 2 state.
* **Isolated Scorecards:** Test results link specifically to the `mockTestId` and `attemptId`.
