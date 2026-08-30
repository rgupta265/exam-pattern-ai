# Development Guidelines — ExamPattern AI

## 1. Incremental Phase Roadmap

* **PHASE 1: Foundation (Current)**
  * Next.js App Router, MySQL 8 Prisma schema, Auth architecture, RBAC, Middleware, Storage provider, Shared layouts, Test suite.
* **PHASE 2: Exam & Blueprint Management (Next)**
  * Exam category & version CRUD, Document processing pipeline, Gemini AI blueprint analysis, Immutable blueprint locking.
* **PHASE 3: Question Bank & Mock Generation**
  * Question schemas, Gemini question generator, Mock test builder, 100% Pattern Compliance Validation Engine.
* **PHASE 4: Candidate Experience & Analytics**
  * Touch-optimized Candidate live exam UI, Attempt lifecycle tracker, Scoring engine, Longitudinal analytics.
* **PHASE 5: Production Hardening**
  * Security audits, Performance optimization, Deployment pipelines.

---

## 2. Quality Gates Before Commits

Every phase must pass all 4 checks:
1. `npm run lint` — ESLint validation
2. `npm run typecheck` — TypeScript strict type checks (`tsc --noEmit`)
3. `npm run test` — Vitest unit and integration tests
4. `npm run build` — Next.js production build verification
