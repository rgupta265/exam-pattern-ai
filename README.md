# ExamPattern AI — Official Blueprint-Verified AI Mock Testing Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1?style=flat&logo=mysql)](https://www.mysql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Engine-8e75ff?style=flat&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> **ExamPattern AI** is an enterprise-grade mock examination platform designed to create authentic exam-pattern simulations using verified examination documents, exam versions, blueprints, syllabus mappings, and controlled Google Gemini AI generation.

---

## 1. Product Principle & Architecture

The platform adheres to this core operational hierarchy:

```
Official Exam Documents (PDF / Advertisement)
  └── Gemini AI Structured Extraction
        └── Human Admin Verification
              └── Locked Exam Blueprint (Immutable Baseline)
                    └── Verified Syllabus Tree
                          └── Question Bank (Manual & AI-Generated)
                                └── Full-Pattern AI Mock Test
                                      └── 11-Point Pattern Validation Engine
                                            └── Candidate Touch-Optimized Attempt
                                                  └── Real-Time Interaction Tracking
                                                        └── Authoritative Score Calculation
                                                              └── Deep Performance & Topic Analytics
```

* **Authoritative Source of Truth:** The **verified exam blueprint** approved and locked by an authorized administrator is the sole authority for all examination rules.
* **AI Authority Boundary:** **AI is never the final authority** for exam rules, question counts, section distribution, negative marking penalties, or time limits. AI functions as an assistive generation and extraction engine strictly bounded by locked blueprints.

---

## 2. Major Capabilities

### Administrator Console
* **Exam & Notification Cycle Management:** Hierarchical organization (`Category` → `Exam` → `Exam Version`) isolating official notifications and corrigendums across years without mutating historical patterns.
* **Official Document Ingestion:** Upload PDF advertisements and syllabus documents to secure local storage with server-side Gemini AI extraction and mandatory admin verification.
* **Syllabus Tree Hierarchy:** Multi-level section and topic management with full tree navigation, "Select All", and parent-child cascades.
* **Blueprint Lifecycle State Machine:** `DRAFT` ──► `AI_ANALYZED` ──► `UNDER_REVIEW` ──► `VERIFIED` ──► `LOCKED` ──► `ACTIVE`. Locked blueprints are permanently immutable.
* **Question Bank Management:** Manual question drafting, bilingual English/Hindi translations, reviewer approval queues, and context-bounded AI question generation.
* **Full Examination Generation:** Assembles full official mock tests strictly enforcing exact question counts, section distribution, topic weightage, marks, negative marking, and duration.
* **11-Point Pattern Validation Engine:** Automated pre-publication engine verifying 100% blueprint compliance, syllabus coverage, and zero duplicate questions.
* **Candidate Attempt Audits:** Inspect full attempt transcripts, answer revision histories, question-level time spent, and scorecard evaluations.
* **Admin Database Management:** Built-in MySQL 8 backup generator, safe testing data reset, clean data isolation, and fresh seed engine (`/[locale]/admin/database`).
* **Audit Logging:** Immutable administrative audit trail recording user IDs, actions, resource types, IP addresses, user agents, and change diffs.

### Candidate Portal
* **Candidate Dashboard:** Longitudinal score progress, overall accuracy, test completion rate, identified strong/weak topics, and recent scorecards.
* **Email & OTP Authentication:** Secure candidate registration with 6-digit email OTP verification, same-screen verification flow, and forgot-password OTP reset.
* **Multi-Step Candidate Profile Onboarding:** Multi-step profile management covering personal details, address, educational qualifications, and work experience.
* **Full Examination Mode:** Authentic examination simulations calibrated strictly to locked blueprints (e.g., 100 questions, 120 minutes, -0.25 negative marking).
* **Section-Wise Question Numbering:** Question numbering strictly restarts from 1 for every section (`Section A: 1..8`, `Section B: 1..5`) with multi-section interactive palettes and cross-section "Save & Next" transitions.
* **Pre-Exam Guidelines:** Bilingual instructions acknowledgement and display language selection before entering the live examination room.
* **Touch-Optimized Exam Room:** Mobile-first UX with server-synchronized countdown timer, interactive question palette, Mark for Review, Clear Answer, and background autosave.
* **Refresh & Disconnection Resiliency:** Browser refreshes safely resume the in-progress attempt with exact remaining time without data loss.
* **Results & Deep Diagnostic Analytics:** Immediate scorecard calculation showing net score, percentage, correct/incorrect breakdown, question time analysis, and step-by-step explanations.
* **Multiple Retakes Support:** Retake the same official mock test multiple times (`maxAttempts: 10`) with incremental attempt numbering (`Attempt 1`, `Attempt 2`, `Attempt 3`...) and best score tracking.
* **Custom AI Practice Drills:** Ingest custom study resources (PDF, DOCX, images, text, educational URLs) to generate targeted practice drills isolated from official mocks.
* **Complete Multilingual Support:** Global English (`/en`) and Hindi (`/hi`) localization with seamless language switching across all pages.

---

## 3. Technology Stack & Prerequisites

### Technology Stack
* **Framework:** Next.js 16.3.3 (App Router, Turbopack, React Server Components by default)
* **Edge Security & Routing:** Next.js 16 Proxy (`src/proxy.ts` convention)
* **Language:** TypeScript 5.7.3 (Strict Mode enabled, zero implicit `any`)
* **UI & Styling:** React 19, Tailwind CSS 3.4, Lucide React
* **Database:** MySQL 8.0
* **ORM:** Prisma ORM 6.4.1 (with modular environment variables)
* **AI Engine:** Google Gemini API (`@google/genai` server-side abstraction)
* **Storage:** Local Filesystem Storage (`LocalStorageProvider`)
* **Validation:** Zod 3.24
* **Testing:** Vitest 3.2 (Unit & Integration), Playwright 1.50 (E2E)

### Prerequisites
Before running ExamPattern AI locally, ensure your system has:
1. **Node.js:** `v20.x` or `v22.x` (LTS recommended)
2. **npm:** `v10.x` or higher
3. **MySQL Server:** `v8.0` or higher running locally on port `3306`
4. **Git:** `v2.x` or higher
5. **Google Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/)

---

## 4. Step-by-Step Local Setup

### Step 4.1: Clone the Repository
```bash
git clone https://github.com/rgupta265/exam-pattern-ai.git
cd exam-pattern-ai
```

### Step 4.2: Install Dependencies
```bash
npm install
```

### Step 4.3: Configure Environment Variables
Copy the example environment configuration file to create `.env.local`:
```bash
# On Windows (PowerShell)
Copy-Item .env.example .env.local

# On Linux / macOS
cp .env.example .env.local
```

---

## 5. Environment Variables Reference

Configure `.env.local` using the following reference table:

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | No | `3000` | HTTP port for local development server |
| `APP_URL` | Yes | `http://localhost:3000` | Base application URL |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Publicly exposed application URL |
| `DB_HOST` | Yes | `127.0.0.1` | MySQL database server host |
| `DB_PORT` | Yes | `3306` | MySQL database server port (1–65535) |
| `DB_NAME` | Yes | `exampattern_ai` | Target MySQL database name |
| `DB_USERNAME` | Yes | `root` / `exam_user` | MySQL database user |
| `DB_PASSWORD` | Yes | `your_secure_password` | MySQL user password |
| `DB_SSL` | No | `false` | Enable strict SSL MySQL connections |
| `DB_POOL_SIZE` | No | `10` | Maximum database connection pool limit |
| `AUTH_SECRET` | Yes | `min-32-chars-random-secret-key-here` | Secret key for JWT session signing |
| `AUTH_EXPIRES_IN` | No | `7d` | Session expiration duration |
| `GEMINI_API_KEY` | Yes | `AIzaSy...` | Google Gemini API key (server-side only) |
| `EMAIL_PROVIDER` | Yes | `smtp` | Email service driver (`smtp`, `console`, `resend`) |
| `EMAIL_HOST` | No | `smtp.gmail.com` | SMTP server host |
| `EMAIL_PORT` | No | `587` | SMTP port (`587` / `465`) |
| `EMAIL_USER` | No | `your-email@gmail.com` | SMTP authentication user |
| `EMAIL_PASSWORD` | No | `your-smtp-app-password` | SMTP authentication password |
| `EMAIL_FROM` | No | `no-reply@exampattern.ai` | Outgoing sender email address |
| `EMAIL_FROM_NAME` | No | `ExamPattern AI` | Outgoing sender display name |
| `STORAGE_DRIVER` | Yes | `local` | Storage provider abstraction (`local`) |
| `STORAGE_PATH` | Yes | `./storage` | Directory path for uploaded documents & assets |
| `MAX_UPLOAD_SIZE_MB` | No | `25` | Maximum upload file size limit in MB |
| `DEFAULT_LOCALE` | Yes | `en` | Fallback language locale (`en`) |
| `SUPPORTED_LOCALES` | Yes | `en,hi` | Comma-separated list of supported locales |
| `LOG_LEVEL` | No | `info` | Server logging level (`debug`, `info`, `warn`, `error`) |

> [!CAUTION]
> **Security Rule:** Never prefix `GEMINI_API_KEY`, `DB_PASSWORD`, database credentials, or `AUTH_SECRET` with `NEXT_PUBLIC_`. Never commit `.env` or `.env.local` files to version control.

---

## 6. MySQL 8 Database Setup & Configuration

ExamPattern AI connects to MySQL 8 using **separately configured environment variables** (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`). The application dynamically constructs and validates the connection safely on the server side. Developers do **not** need to manually maintain a composite `DATABASE_URL` string.

### Local Development MySQL Setup:
1. **Start MySQL 8 Server** on your local machine.
2. **Create Database and Developer User (Local Development Example):**
   ```sql
   -- LOCAL DEVELOPMENT EXAMPLE ONLY
   CREATE DATABASE IF NOT EXISTS exampattern_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

   -- Create local developer user
   CREATE USER IF NOT EXISTS 'exam_user'@'localhost' IDENTIFIED BY 'your_secure_password';

   -- Grant all privileges on local database
   GRANT ALL PRIVILEGES ON exampattern_ai.* TO 'exam_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` in your `.env.local` or `.env`.

---

## 7. Prisma Setup & Migrations

Execute the following npm scripts to initialize the database schema and generate Prisma Client with separate `DB_*` variables:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Push Database Schema / Run Migrations (Local Development)
npm run prisma:push
# (or: npm run prisma:migrate)

# 3. Seed Initial Exam Categories & Super Admin Account
npm run prisma:seed

# 4. Open Prisma Studio GUI (Optional database browser)
npx prisma studio
```

> [!IMPORTANT]
> **Admin-Only Seed Policy:** The seeding process initializes only the Super Admin account (configured via `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local`). **Zero candidate accounts** are seeded. Candidate accounts are created exclusively through public registration (`/register`) with enforced `CANDIDATE` role isolation.

---

## 8. Local Storage Setup

ExamPattern AI uses a local filesystem storage abstraction (`LocalStorageProvider`) to avoid paid cloud storage dependencies:

```
storage/
├── private/
│   ├── notifications/         # Official exam notification PDFs & advertisements
│   ├── question-assets/       # Diagram images & question asset attachments
│   ├── candidate-documents/   # Candidate practice reference files (PDF/DOCX/Images)
│   ├── application-tours/     # Private Tour Videos (Full Tour & Candidate End Tour)
│   ├── backups/               # Full MySQL 8 database backup archives (.sql)
│   └── exports/               # Generated reports and exports
└── public/
    └── avatars/               # User profile pictures
```

The system automatically initializes these folders on startup. Ensure the application process has write permissions to `./storage`. Private files are never placed in the Next.js `public/` folder and can only be streamed through authenticated/authorized API endpoints with HTTP 206 range streaming support.

---

## 9. Google Gemini AI Configuration

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Set `GEMINI_API_KEY="your-api-key"` in `.env.local`.
3. **AI Scope Restriction:** Gemini calls execute strictly server-side through `gemini-question.service.ts` and `gemini-document.service.ts`. The AI is strictly bounded by the selected exam context, verified documents, and locked syllabus topics.

---

## 10. Starting the Application

```bash
# Start Next.js Development Server (with Turbopack)
npm run dev
```

Open your browser and navigate to:
* **Canonical English Portal:** [http://localhost:3000/en](http://localhost:3000/en)
* **Canonical Hindi Portal:** [http://localhost:3000/hi](http://localhost:3000/hi)

---

## 11. Route Reference Table

| Route / Section | English URL | Hindi URL | Access Role |
|---|---|---|---|
| **Landing Home** | `/en` | `/hi` | Public |
| **Sign In** | `/en/login` | `/hi/login` | Public |
| **Candidate Registration** | `/en/register` | `/hi/register` | Public |
| **Candidate Dashboard** | `/en/candidate/dashboard` | `/hi/candidate/dashboard` | Candidate |
| **Explore Exams** | `/en/candidate/exams` | `/hi/candidate/exams` | Candidate |
| **Mock Tests Catalog** | `/en/candidate/mock-tests` | `/hi/candidate/mock-tests` | Candidate |
| **Pre-Exam Instructions** | `/en/candidate/attempts/[id]/instructions` | `/hi/candidate/attempts/[id]/instructions` | Candidate |
| **Live Touch Exam Room** | `/en/candidate/attempts/[id]` | `/hi/candidate/attempts/[id]` | Candidate |
| **Test Result & Scorecard** | `/en/candidate/results/[id]` | `/hi/candidate/results/[id]` | Candidate |
| **Practice Drills** | `/en/candidate/practice` | `/hi/candidate/practice` | Candidate |
| **Candidate App Tour** | `/en/candidate/application-tour` | `/hi/candidate/application-tour` | Candidate |
| **Admin Dashboard** | `/en/admin/dashboard` | `/hi/admin/dashboard` | Admin |
| **Admin Exams & Versions** | `/en/admin/exams` | `/hi/admin/exams` | Admin |
| **Admin Notifications** | `/en/admin/notifications` | `/hi/admin/notifications` | Admin |
| **Admin Blueprints** | `/en/admin/blueprints` | `/hi/admin/blueprints` | Admin |
| **Admin Question Bank** | `/en/admin/questions` | `/hi/admin/questions` | Admin |
| **Admin Mock Tests** | `/en/admin/mock-tests` | `/hi/admin/mock-tests` | Admin |
| **Admin Candidates** | `/en/admin/candidates` | `/hi/admin/candidates` | Admin |
| **Admin Database Management** | `/en/admin/database` | `/hi/admin/database` | Admin |
| **Admin Reports & Analytics** | `/en/admin/reports` | `/hi/admin/reports` | Admin |
| **Admin Audit Logs** | `/en/admin/audit-logs` | `/hi/admin/audit-logs` | Admin |
| **Admin App Tour** | `/en/admin/application-tour` | `/hi/admin/application-tour` | Admin |

---

## 12. Application Tours & Video Storyboards

ExamPattern AI provides comprehensive interactive application tours for onboarding new administrators and candidates:

### Interactive In-App Tours
* **Administrator Tour:** Navigate to `/[locale]/admin/application-tour`
* **Candidate Tour:** Navigate to `/[locale]/candidate/application-tour`

### Standalone HTML Tour Guides
Open directly in any modern browser without running a server:
* `docs/ADMIN_APPLICATION_TOUR.html` — Standalone responsive Admin guide with English/Hindi toggle.
* `docs/CANDIDATE_APPLICATION_TOUR.html` — Standalone responsive Candidate guide with English/Hindi toggle.

### Video Walkthrough Storyboards & Scripts
* `docs/ADMIN_APPLICATION_TOUR_VIDEO_SCRIPT.md` — 7-scene production storyboard for Admin console walkthrough.
* `docs/CANDIDATE_APPLICATION_TOUR_VIDEO_SCRIPT.md` — 6-scene production storyboard for Candidate examination walkthrough.

---

## 13. Database Management & Maintenance (Backup, Clean & Seed)

The platform provides a secure, server-side Admin-only Database Management console at `/[locale]/admin/database`:

### Core Maintenance Capabilities:
1. **Infrastructure & Connection Status:** Real-time MySQL 8 health check, database name, masked host, port, active tables count, and estimated live rows.
2. **Server-Side MySQL 8 Backups:** Generates full standard `.sql` backup dumps stored privately in `./storage/private/backups/`. Features one-click creation, metadata tracking, secure authorized streaming download, and deletion.
3. **Controlled Data Cleaning:** Safely resets candidate accounts, attempts, results, and practice drills for testing. Super Admin and Admin accounts are strictly protected and never deleted. Requires explicit confirmation phrase (`DELETE ALL TEST DATA` in development, `CONFIRM PRODUCTION DATA RESET` in production).
4. **Authoritative Fresh Seed Engine:** Populates initial official exam blueprints, syllabi, and sample mocks. Strictly preserves **Candidate Count = 0**.
5. **Operation Concurrency Lock:** In-memory locking mechanism (`IDLE`, `BACKUP`, `CLEAN`, `SEED`) prevents race conditions and concurrent destructive tasks.

---

## 14. Command Reference Table

All scripts defined in `package.json`:

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js local development server with Turbopack at `http://localhost:3000` |
| `npm run build` | Compiles and builds the production-optimized Next.js 16 application |
| `npm run start` | Starts the Next.js production server from `.next` build output |
| `npm run lint` | Runs ESLint 9 across all TypeScript and React files with 0 warnings |
| `npm run typecheck` | Executes TypeScript type checking (`tsc --noEmit`) in strict mode |
| `npm run check-translations` | Validates 100% parity across `messages/en.json` and `messages/hi.json` |
| `npm run test` | Runs the full Vitest unit and integration test suite (207+ tests) |
| `npm run test:watch` | Starts Vitest in interactive watch mode for TDD |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests |
| `npm run prisma:generate` | Generates the Prisma Client TypeScript artifacts with modular DB config |
| `npm run prisma:migrate` | Runs Prisma schema migrations in development mode |
| `npm run prisma:seed` | Executes database seeding script (`prisma/seed.ts`) |

---

## 15. GitHub Contribution Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/phase-name
   ```
2. Implement your changes following rules in `AGENTS.md`.
3. Verify all quality gates:
   ```bash
   npm run check-translations
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
4. Commit your changes with clear, semantic commit messages:
   ```bash
   git commit -m "feat(exam): implement full examination retake mode"
   ```
5. Push to your branch and open a Pull Request.

---

## 16. Security Guidelines

* **Server-Side AI Abstraction:** All Google Gemini API interactions execute exclusively on the server. Never expose API keys to the browser.
* **Role-Based Access Control:** Every API endpoint and server action validates session identity and granular permissions (`EXAM_CREATE`, `BLUEPRINT_LOCK`, `MOCK_PUBLISH`, etc.).
* **Private Storage Streaming:** Private documents (notifications, candidate notes) are never placed in the Next.js `public/` directory; they are streamed through authenticated, permission-checked route handlers.
* **Server-Authoritative Evaluation:** Scores, time limits, and answer keys are calculated strictly on the server. Zero client trust is maintained throughout the examination lifecycle.

---

## 17. License & Copyright

© 2026 **ExamPattern AI**. Built with Next.js 16 App Router, MySQL 8, Prisma ORM, and Google Gemini AI. All Rights Reserved.
