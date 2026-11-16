# Mock Test Generation Architecture

## Core Architectural Principle

> **The verified/locked Exam Blueprint, verified Syllabus, and verified Official Exam Documents are the sole authoritative source of truth for generating full-pattern mocks.**
> Gemini AI is never allowed to independently define or alter the official exam pattern, sectional distributions, question counts, marks, or negative marking penalties.

---

## Phase 8 One-Click Actual-Pattern Mock Generation

In Phase 8, the platform introduces **One-Click Actual-Pattern Mock Generation** (`ActualPatternGeneratorService`):

1. **Pre-Generation Document Readiness Checklist**:
   - Checks that all required official documents for the specific `examVersionId` (e.g. `OFFICIAL_NOTIFICATION`, `EXAM_PATTERN`, `SYLLABUS`) are uploaded and marked `VERIFIED`.
   - Checks that an active, verified/locked `ExamBlueprint` exists.
   - Checks that a verified `Syllabus` with active sections and topics exists.
   - If any required component is missing or unverified, generation is strictly blocked.

2. **Automatic Section-by-Section Distribution**:
   - The engine queries the locked blueprint and calculates exact section question counts (e.g. Section A: 50, Section B: 30, Section C: 20 -> Total 100 Qs).
   - Topic distribution is deterministically calculated across the verified syllabus sections.
   - Server constructs an immutable `MockGenerationPlan`.

3. **Strict Version Isolation**:
   - An exam version (e.g., UP Health Officer 2026) only accesses documents and syllabus nodes belonging to that exact version. It never mixes context with past or future cycles (e.g. 2025).

4. **Multi-Mock Tracking**:
   - Supports creating multiple unique actual-pattern mocks: `UPHO-2026-MOCK-001`, `UPHO-2026-MOCK-002`, `UPHO-2026-MOCK-003`.
   - Each mock features newly generated, distinct questions while adhering 100% to the identical authoritative blueprint.

5. **Atomic Generation & Pattern Validation**:
   - Structured output parsing + Zod schemas + `AIScopeGuard` + `MockPatternValidatorService`.
   - Mocks transition `GENERATING` -> `VALIDATED` -> `PUBLISHED`. Failed mocks do not appear in candidate catalogs.

---

## Candidate-Initiated Mock & Topic Drill Generation

In addition to pre-published administrative mock tests, registered candidates can generate on-demand examination simulations directly from their portal (`/candidate/mock-tests`):

1. **Full-Pattern Blueprint Mocks (100% Pattern & Syllabus Accurate)**:
   - Candidates select any active Exam and Cycle/Version (e.g. Supreme Court TAP Stage 1, Stage 2, or UP Health Officer).
   - Generates a new, full-pattern mock test strictly matching the locked blueprint:
     - Exact total question count (e.g., 100 Qs for Stage 1, 50 Qs for Stage 2, 100 Qs for UPHO).
     - Section-by-section distribution (e.g. Stage 1: 50 English, 20 Reasoning, 20 Quant, 10 GK; Stage 2: 15 DSA, 15 DBMS, 10 Networks, 10 OS; UPHO: 80 Clinical Domain, 20 General Aptitude).
     - Exact duration (90m or 120m), marks (100 or 50), and negative marking rate (0.25).
     - 100% Syllabus alignment with zero duplicate questions.
   - Automatically verified by `MockPatternValidatorService.validate()` prior to candidate attempt.

2. **Targeted Topic Practice Drills**:
   - Candidates choose a specific verified syllabus topic (e.g., "Data Structures & Algorithms", "English Grammar & Usage", "Community Health Nursing").
   - Candidates specify the exact number of questions (10, 15, 20, 30, or 50 questions), target difficulty (`EASY`, `MEDIUM`, `HARD`), and language.
   - Bounded strictly by `AIScopeGuard` and verified syllabus nodes; candidates cannot generate arbitrary unverified topics.
   - Assembles questions from existing approved items in the Question Bank and supplements with Gemini AI if additional items are needed.
   - Attaches validation records and makes the drill immediately playable.

---

## Snapshot Stability Rule

Once a mock test is generated, its questions, sections, marks, and negative deduction rules are frozen in `MockTest`, `MockTestSection`, and `MockTestQuestion`. Historical mock tests do not mutate if future exam blueprints change.
