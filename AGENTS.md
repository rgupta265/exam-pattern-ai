# AGENTS.md — ExamPattern AI Project Rules & System Instructions

> **Notice to AI Assistants & Engineers:**
> This file is the single source of truth for the entire ExamPattern AI codebase.
> Before making any changes or starting any phase of implementation, read and strictly adhere to all instructions and rules in this document.

---

## 1. Product Principle

The platform follows this core architecture:

```
Official Exam Documents
  └── Gemini AI Analysis
        └── Structured Exam Information
              └── Admin Verification
                    └── Locked Exam Blueprint
                          └── Verified Syllabus
                                └── Question Bank
                                      └── AI Mock Generation
                                            └── Pattern Validation
                                                  └── Candidate Attempt
                                                        └── Complete Tracking
                                                              └── Results
                                                                    └── Analytics
                                                                          └── Gemini Performance Analysis
```

* The **verified exam blueprint** is the authoritative source of truth.
* **AI is never the final authority** for official exam rules.

---

## 2. Technology Stack

* **Framework:** Next.js (latest stable version, App Router)
* **Language:** TypeScript (strict mode enabled)
* **UI Library:** React, Tailwind CSS, shadcn/ui (where appropriate)
* **Database:** MySQL 8
* **ORM:** Prisma ORM
* **AI Engine:** Google Gemini API (server-side only)
* **Storage:** Local filesystem storage abstraction (LocalStorageProvider)
* **Validation:** Zod
* **Testing:** Vitest (unit/integration), Playwright (E2E)
* **Code Quality:** ESLint, Prettier

**Architecture:** Modular monolith architecture.
* Do **NOT** introduce microservices in V1 unless explicitly requested.

---

## 3. Database Rule

* The database must strictly be **MySQL 8** managed via **Prisma ORM**.
* Do **NOT** switch to PostgreSQL, MongoDB, SQLite, or any other database engine unless explicitly instructed.
* Mandatory database design standards:
  * Proper foreign keys
  * Comprehensive indexes
  * Unique constraints
  * Database transactions for atomic multi-step operations
  * Appropriate cascading / restrict behavior
  * Automatic timestamps (`createdAt`, `updatedAt`)
  * Soft deletion (`deletedAt`) where appropriate
* **Identifier Security:**
  * Do not expose sequential database IDs through public URLs or APIs.
  * Use UUIDs (or CUIDs) for externally exposed identifiers.

---

## 4. AI Rule

* Use **Google Gemini** for all AI processing.
* **Server-side only:** All Gemini calls must execute on the server. Never expose the Gemini API key or credentials to the browser/client.
* **Abstraction layer:** Implement an AI service abstraction layer (`AIService` / `GeminiProvider`). Never invoke Gemini directly from React components or route handlers without passing through the service layer.
* **Permitted AI responsibilities:**
  * Notification analysis
  * Exam pattern extraction
  * Syllabus extraction
  * Previous-year paper analysis
  * Question generation
  * Question validation
  * Duplicate question detection
  * Detailed step-by-step explanations
  * Candidate performance analysis & diagnostic feedback
  * Personalized study recommendations
* **Validation requirement:** All AI-generated data must strictly pass runtime Zod schemas and business logic validation before persistence.
* **Authority rule:** The verified exam blueprint approved by an authorized admin is the sole authority.

---

## 5. Official Exam Pattern Rule

The platform hierarchy is strictly structured as:

```
Exam Category
  └── Exam
        └── Exam Version
              └── Official Documents
                    └── Verified Blueprint
                          └── Syllabus
```

*Example Hierarchy:*
`Government Jobs` → `UP Health Officer` → `2026`

Candidates must be able to discover and search for exams by:
* Exam name
* Category
* Conducting authority / organization
* Post / designation
* Year / notification cycle

---

## 6. Blueprint Rule

The **Exam Blueprint** is the definitive source of truth for all full-pattern mock tests.

A blueprint specifies:
* Total questions
* Total marks
* Duration (in minutes)
* Negative marking rules (e.g., fractional deductions, zero penalty)
* Sections / parts
* Question count per section
* Marks per section
* Question types (single-choice MCQ, multi-select, numerical, etc.)
* Supported languages (e.g., English, Hindi)
* Difficulty distribution (Easy, Medium, Hard percentages)
* Topic / subject weightage distribution
* Special exam-specific instructions & rules

### Blueprint Lifecycle State Machine:
```
DRAFT ──► AI_ANALYZED ──► UNDER_REVIEW ──► VERIFIED ──► LOCKED ──► ACTIVE
```

* **Immutability:** Once a blueprint reaches the `LOCKED` state, it must **never** be silently modified or mutated.
* **Versioning:** Any official corrigendum, amendment, or new notification must spawn a new distinct version (`v2`, `v3`, etc.).
* **History:** Never overwrite or mutate historical exam-pattern data.

---

## 7. Mock Test Rule

The platform supports 5 test modalities:
1. **Full Exam Mock:** Must strictly adhere to the locked official blueprint.
2. **Topic Practice Mock:** Must validate that the requested topic exists within the verified syllabus. Candidates must **not** be allowed to request arbitrary topics outside the official syllabus for AI question generation.
3. **Sectional Mock:** Targeted mock matching specific blueprint sections.
4. **Previous Year Practice:** Verified past exam questions conforming to historical patterns.
5. **AI-generated Practice:** Dynamic drills bounded strictly by syllabus and blueprint rules.

---

## 8. Pattern Validation Rule

Every full-pattern mock test must pass a dedicated, automated validation engine before publication.

Validation Engine Checks:
* [x] Total question count matches blueprint
* [x] Section-by-section question distribution matches blueprint
* [x] Total marks and per-question marks match blueprint
* [x] Negative marking values match blueprint
* [x] Duration matches blueprint
* [x] Question types match blueprint specifications
* [x] Supported languages match blueprint specifications
* [x] 100% syllabus alignment (every question maps to a valid syllabus node)
* [x] Topic weightage distribution matches blueprint tolerances
* [x] Difficulty distribution matches blueprint tolerances
* [x] Zero duplicate or near-duplicate questions

**Failure Handling:**
* If validation fails, the mock test must **not** be published or made accessible to candidates.
* The validation engine must produce a detailed report pinpointing the exact rule and question that failed.
* **Guarantee:** The platform guarantees 100% compliance with the verified blueprint. It does **not** claim to predict exact future exam questions.

---

## 9. Mobile-First Rule

* This application is primarily consumed on mobile devices.
* **Mobile-first responsive design is mandatory.** A feature is incomplete if it only functions on desktop.
* Target viewport matrix for responsive validation:
  * `360×640` (Small mobile)
  * `390×844` (Standard mobile / iPhone)
  * `412×915` (Modern Android mobile)
  * `768×1024` (Tablet / iPad portrait)
  * `1280×720` (Compact laptop / HD)
  * `1440×900` (Standard desktop)
  * `1920×1080` (Full HD desktop)
* Zero horizontal scrolling on standard layout pages.
* Use mobile-first Tailwind CSS utility patterns (`w-full md:w-auto`, etc.).

---

## 10. Candidate Exam UI Rule

The live exam-taking interface is a mission-critical mobile touch experience.

Core features:
* Resilient countdown timer with server synchronization
* Interactive question palette (collapsible/drawer on mobile, side-panel on desktop)
* Next & Previous question controls
* Clear Answer option
* Mark for Review & Next toggle
* Touch-friendly option selection targets (min 44px touch targets)
* Section tab navigation
* Explicit Submit modal confirmation
* Automated auto-submit on timer expiry
* Background autosave for every answer selection/change event
* Responsive adaptation: do not shrink desktop views; deliver a dedicated, optimized mobile exam UX.

---

## 11. Next.js Routing Rule — VERY IMPORTANT

* Use the standard Next.js App Router.
* **NEVER** use a single page with state-based show/hide logic (e.g., `activePage === "results"`, `activePage === "questions"`, `activePage === "profile"`) for major screens.
* Every major screen must have its own dedicated route and page/component tree.

### Candidate Route Tree:
* `/candidate/dashboard`
* `/candidate/exams`
* `/candidate/exams/[examId]`
* `/candidate/mock-tests`
* `/candidate/mock-tests/[mockTestId]`
* `/candidate/attempts/[attemptId]`
* `/candidate/results`
* `/candidate/results/[resultId]`
* `/candidate/results/[resultId]/questions`
* `/candidate/results/[resultId]/analysis`
* `/candidate/results/[resultId]/topics`
* `/candidate/results/[resultId]/time-analysis`
* `/candidate/performance`
* `/candidate/profile`
* `/candidate/settings`

### Admin Route Tree:
* `/admin/dashboard`
* `/admin/exams`
* `/admin/exams/[examId]`
* `/admin/exams/[examId]/documents`
* `/admin/exams/[examId]/blueprint`
* `/admin/exams/[examId]/syllabus`
* `/admin/exams/[examId]/questions`
* `/admin/exams/[examId]/mock-tests`
* `/admin/candidates`
* `/admin/candidates/[candidateId]`
* `/admin/candidates/[candidateId]/attempts`
* `/admin/candidates/[candidateId]/results`
* `/admin/candidates/[candidateId]/performance`
* `/admin/candidates/[candidateId]/activity`

Shared layouts (`layout.tsx`) and reusable components are encouraged, but route transitions must use standard URL routing.

---

## 12. Authentication Rule

User Roles:
* `SUPER_ADMIN`
* `ADMIN`
* `QUESTION_REVIEWER`
* `CANDIDATE`

Requirements:
* Secure authentication & session architecture (HTTP-only cookies, robust password hashing, CSRF protection).
* Never rely on or trust client-side authentication state for authorization.

---

## 13. Authorization Rule

* Architecture: **RBAC + Granular Permissions**
* Granular permissions include:
  * `EXAM_VIEW`, `EXAM_CREATE`, `EXAM_UPDATE`, `EXAM_DELETE`
  * `DOCUMENT_VIEW`, `DOCUMENT_UPLOAD`, `DOCUMENT_PROCESS`
  * `BLUEPRINT_VIEW`, `BLUEPRINT_UPDATE`, `BLUEPRINT_VERIFY`, `BLUEPRINT_LOCK`
  * `QUESTION_VIEW`, `QUESTION_CREATE`, `QUESTION_UPDATE`, `QUESTION_REVIEW`, `QUESTION_APPROVE`
  * `MOCK_VIEW`, `MOCK_CREATE`, `MOCK_PUBLISH`
  * `CANDIDATE_VIEW`, `CANDIDATE_ATTEMPT_VIEW`, `CANDIDATE_RESULT_VIEW`, `CANDIDATE_PERFORMANCE_VIEW`
  * `AUDIT_LOG_VIEW`
* **Multi-Layer Enforcement:**
  1. Next.js middleware for route-level filtering.
  2. Mandatory server-side permission checks in API routes, server actions, and domain services.

```
Request ──► Authentication ──► Middleware ──► Route ──► Server Authorization ──► Business Logic ──► Database
```

---

## 14. Candidate Tracking Rule

Track the complete lifecycle and interaction event log of every candidate attempt:
* Session start time & submission time
* Question view events & durations
* Selected answers, answer changes, and cleared answers
* Marked for review status toggles
* Section switch events
* Per-question time spent tracking
* Final submitted answers vs. official answer keys
* Automated marks calculation & penalty deductions
* Generated scorecard & performance result

**Comparison views for candidate:**
* Candidate Answer vs. Correct Answer vs. Detailed Explanation vs. Marks Awarded vs. Time Spent.
* Authorized administrators must be able to inspect the candidate's complete audit trail and event logs.

---

## 15. Candidate Dashboard Rule

The Candidate Dashboard must present:
* Tests attempted & completion rate
* Average score & best score
* Overall accuracy percentage
* Recent test history & scorecards
* Exam-wise performance breakdown
* Subject & topic performance breakdown
* Identified weak topics (target areas for improvement)
* Identified strong topics
* Longitudinal progress trends over time
* Gemini-powered personalized recommendations

---

## 16. Admin Candidate Visibility

Authorized administrators must have full diagnostic visibility into:
* Candidate profile & registration details
* All exams and mock tests attempted
* Detailed attempt transcripts & event logs
* Answers chosen, revisions made, and time spent per item
* Topic and subject-level performance metrics
* Real-time candidate activity logs

**Tenant & Candidate Isolation:**
* Strict candidate data isolation. Candidates can never view data belonging to other candidates.
* Admins access candidate records only through authorized role-gated routes.

---

## 17. Local Storage Rule

* Use **local filesystem storage** in V1 (no paid cloud storage dependencies).
* Storage layout directory structure:
  ```
  storage/
  ├── private/
  │   ├── notifications/
  │   ├── question-assets/
  │   ├── exports/
  │   └── candidate-documents/
  └── public/
      └── avatars/
  ```
* **Security constraint:** Private files must **never** be served directly or placed in the Next.js `public/` directory.
* **Storage Abstraction:** Implement a `StorageService` interface with `LocalStorageProvider` as the V1 provider. Store file metadata (path, size, mimeType, checksum) in the database.

---

## 18. File Security Rule

For all uploaded files:
* Validate file extension and MIME type against strict whitelists.
* Enforce maximum file size limits per file type.
* Sanitize and randomize stored filenames.
* Compute and store file checksums (SHA-256).
* Defend against path traversal (`../`) attacks.
* Prevent arbitrary file execution.
* Restrict private file access to authenticated, authorized users via secure streaming route handlers.

---

## 19. Audit Rule

Log all critical administrative, exam-pattern, and sensitive operations:
* Exam creation, modification, deletion
* Official document uploads & AI extraction triggers
* Blueprint modifications, verification, and locking
* Question approval, rejection, and edits
* Mock test generation and publication
* User permission and role modifications
* Administrative access to candidate records

Each audit record must store `userId`, `action`, `resourceType`, `resourceId`, `ipAddress`, `userAgent`, `changesDiff`, and `timestamp`.

---

## 20. Code Quality Rule

* **TypeScript:** Strict mode enabled with zero implicit `any`.
* **Modularity:** Small, focused, single-responsibility modules.
* **Separation of Concerns:** Keep business logic inside domain services; keep UI components focused purely on presentation and user interaction.
* **DRY Principle:** Centralize reusable business rules and avoid duplicate logic across routes.
* **Validation:** Validate all incoming requests and payloads using Zod schemas on the server side.
* **API Uniformity:** Consistent JSON envelope format for all API responses: `{ success: boolean, data?: T, error?: { code: string, message: string, details?: any } }`.
* **UX Resilience:** Implement explicit loading states, error boundaries, and informative empty states for all views.

---

## 21. Server/Client Component Rule

* **Default to Server Components:** Keep pages and components as Next.js React Server Components (RSC) by default.
* **Client Components:** Use `"use client"` only where browser interaction, client state, or browser APIs are strictly needed:
  * Exam countdown timer & live interaction palette
  * Answer selection and interactive radio/checkbox controls
  * Interactive data visualization charts
  * Mobile drawer/sidebar state toggles
* Do not mark entire route pages `"use client"` when child components can encapsulate client interactivity.

---

## 22. Performance Rule

* Optimized for low-bandwidth mobile networks and low-powered devices.
* Mandatory server-side pagination and filtering for large lists.
* Lazy loading and dynamic imports for heavy client libraries (e.g., charts).
* Efficient Prisma queries with explicit `select` fields to prevent over-fetching and N+1 query bottlenecks.
* Responsive optimized images (`next/image`).
* Proper HTTP caching headers and Next.js revalidation where appropriate.

---

## 23. Testing Rule

* **Vitest:** Unit and integration tests for:
  * Business logic and domain services
  * RBAC and granular permission checks
  * Blueprint validation engine
  * Mock pattern compliance validator
  * Scoring and penalty calculation engines
  * Authentication flows & candidate data isolation
* **Playwright:** E2E tests for:
  * Candidate exam-taking workflow (timer, answer selection, autosave, submission)
  * Admin document upload to verified blueprint lifecycle
  * Mobile viewport test runs across all target screen sizes (`360×640` to `1920×1080`)

---

## 24. Security Rule

* **Confidentiality:** Never expose passwords, session secrets, private API keys, or Gemini keys to the client or version control.
* **Zero Client Trust:** Never trust client-computed scores, client-reported timers, client permissions, client-selected exam patterns, or client-provided answer keys.
* **Server Authority:** The server calculates scores, enforces time limits, validates answers, and verifies authorization.

---

## 25. Documentation Rule

Maintain comprehensive documentation in the `docs/` directory:
* `docs/architecture.md`
* `docs/database.md`
* `docs/routing.md`
* `docs/authentication.md`
* `docs/authorization.md`
* `docs/ai-architecture.md`
* `docs/mock-generation.md`
* `docs/pattern-validation.md`
* `docs/candidate-tracking.md`
* `docs/storage.md`
* `docs/testing.md`
* `docs/deployment.md`

Update documentation synchronously whenever architectural decisions or contracts change.

---

## 26. Development Workflow Rule

Before implementing any feature:
1. Inspect existing architecture and directory structure.
2. **Read `AGENTS.md` first.**
3. Check existing modules and domain services.
4. Check existing database Prisma models and migrations.
5. Check existing Next.js App Router routes.
6. Reuse existing abstractions and services.
7. Implement the smallest clean, testable change.
8. Add or update corresponding unit/integration/E2E tests.
9. Run linter (`npm run lint`).
10. Run TypeScript typecheck (`npx tsc --noEmit`).
11. Run test suite (`npm run test`).
12. Run build verification (`npm run build`).
13. Update corresponding documentation in `docs/`.

Do not rewrite working code without architectural rationale.
Do not create duplicate implementations of existing utilities.

---

## 27. Phase Discipline

Implementation proceeds in disciplined, incremental phases:

* **PHASE 1: Foundation**
  * Architecture, MySQL/Prisma setup, Authentication, RBAC, Routing structure, Storage service.
* **PHASE 2: Exam & Blueprint Management**
  * Exam entity management, Official document processing, Gemini analysis engine, Blueprint lifecycle, Syllabus management.
* **PHASE 3: Question Bank & Mock Generation**
  * Question bank schema, Gemini question generator, Mock test generator, Pattern Validation Engine.
* **PHASE 4: Candidate Experience & Analytics**
  * Touch-optimized Candidate Exam UI, Lifecycle Attempt Tracker, Scoring engine, Results & Deep Performance Analytics, Gemini candidate diagnostic reports.
* **PHASE 5: Hardening & Production Readiness**
  * Security audits, Performance optimization, Full test suite coverage (Vitest + Playwright), Deployment guides.

Do not implement later-phase functionality prematurely unless explicitly requested.

---

## 28. Completion Rule

A feature is considered complete **only** when all of the following criteria are satisfied:
* [x] Core functionality works as specified.
* [x] Server-side permissions and RBAC checks are fully verified.
* [x] Schema and business logic validation are active.
* [x] Error handling, loading, and empty states are implemented.
* [x] Mobile UI layout functions cleanly across all target viewport sizes (`360×640`, `390×844`, `412×915`, `768×1024`, `1280×720`, `1440×900`, `1920×1080`).
* [x] Unit/integration/E2E tests exist and pass.
* [x] Linter passes without warnings/errors.
* [x] TypeScript typecheck passes without errors.

---

## 29. Critical Instruction for Every Future Antigravity Session

1. **Read `AGENTS.md` first** before planning or executing any task.
2. Inspect the existing implementation and repository state; do not assume the codebase is empty.
3. Do not overwrite existing work without a clear, documented architectural reason.
4. Preserve established architecture, service contracts, and database models.
5. If a requested feature appears to conflict with any rule in `AGENTS.md`, explain the conflict clearly and propose the safest architectural solution before modifying the rule.

---

## 30. Production Security & Data Isolation Non-Negotiables

1. **Zero Candidate Seed Data:** Never seed candidate accounts into the database. Initial seeding is strictly restricted to authorized Admin accounts configured via server environment variables.
2. **Zero Client Trust:** Scores, timer limits, permissions, and question keys must never be trusted from client payloads.
3. **Private Storage Isolation:** Private documents, candidate study notes, and application tour videos must reside outside `public/` in `./storage/private/` and be streamed exclusively through authorized, path-normalized API route handlers.
4. **Canonical Locale Routing:** All user-facing routes must be prefixed with supported canonical locales (`/en/...` or `/hi/...`).
5. **SSRF Defense:** URL ingestion must strictly block private IP ranges, loopbacks, link-local addresses, and cloud metadata endpoints.

