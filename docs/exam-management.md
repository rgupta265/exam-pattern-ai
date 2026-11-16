# Exam Management Architecture

## Hierarchy

The platform implements the strict hierarchy specified in `AGENTS.md`:

```
Exam Category
  └── Exam
        └── Exam Version
              └── Official Documents
                    └── Verified Blueprint
                          └── Syllabus
```

*Example 1 (Healthcare Domain):*
`Government Jobs` → `UP Health Officer Examination` → `2026 Regular` → `UP-CHO-2026-Notification.pdf` → `Official UP CHO Full Exam Blueprint` → `Official UP CHO Syllabus 2026`

*Example 2 (Judicial Technical Multi-Stage Domain):*
- **Stage 1 Written Test:** `Government Jobs` → `Supreme Court TAP — Stage 1 (General Aptitude & English)` (`SCI-TAP-S1`) → `2026 Regular` → `Official Supreme Court TAP Stage 1 Objective Written Blueprint` (100 Qs / 100 Marks) → `Official Supreme Court TAP Stage 1 Syllabus 2026`
- **Stage 2 Technical Test:** `Government Jobs` → `Supreme Court TAP — Stage 2 (Technical Aptitude Test)` (`SCI-TAP-S2`) → `2026 Regular` → `Official Supreme Court TAP Stage 2 Technical Aptitude Blueprint` (50 Qs / 50 Marks) → `Official Supreme Court TAP Stage 2 Technical Syllabus 2026`

---

## Entities & Models

1. **ExamCategory (`exam_categories`)**
   - Represents the broad examination domain / vertical (e.g., Government Jobs, Medical & Nursing, Banking & Insurance).
   - Fields: `id`, `name`, `slug`, `description`, `icon`, `createdAt`, `updatedAt`, `deletedAt`.

2. **Exam (`exams`)**
   - Represents the specific examination entity.
   - Fields: `id`, `categoryId`, `name`, `slug`, `code`, `authority`, `postName`, `description`, `isFeatured`, `isActive`, `deletedAt`.

3. **ExamVersion (`exam_versions`)**
   - Represents a specific notification cycle or corrigendum release (e.g., `2026 Regular`, `Corrigendum-1`).
   - Lifecycle States: `DRAFT`, `PROCESSING`, `UNDER_REVIEW`, `VERIFIED`, `ACTIVE`, `ARCHIVED`.
   - Fields: `id`, `examId`, `year`, `versionName`, `notificationNumber`, `status`, `isActive`, `effectiveDate`, `description`.

---

## Server-Side Filtering & Candidate Isolation

- Candidates querying `/candidate/exams` or `/api/exams?isCandidateFacing=true` are strictly filtered to only view exams that have `isActive: true` and at least one version in `VERIFIED` or `ACTIVE` state.
- Soft-deleted exams (`deletedAt != null`) are never exposed.

---

## Permissions & RBAC Enforcement

- `EXAM_CATEGORY_VIEW`, `EXAM_CATEGORY_CREATE`, `EXAM_CATEGORY_UPDATE`, `EXAM_CATEGORY_DELETE`
- `EXAM_VIEW`, `EXAM_CREATE`, `EXAM_UPDATE`, `EXAM_DELETE`
- Enforced at Middleware, API routes, and `RbacService` domain layers.
