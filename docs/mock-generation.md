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

## Snapshot Stability Rule

Once a mock test is generated, its questions, sections, marks, and negative deduction rules are frozen in `MockTest`, `MockTestSection`, and `MockTestQuestion`. Historical mock tests do not mutate if future exam blueprints change.
