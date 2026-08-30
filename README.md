# ExamPattern AI — Official Blueprint-Verified AI Mock Testing Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1?style=flat&logo=mysql)](https://www.mysql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Engine-8e75ff?style=flat&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> **ExamPattern AI** is a production-oriented mock examination platform designed to create authentic exam-pattern simulations using verified examination documents, exam versions, blueprints, syllabus mappings, and controlled Google Gemini AI generation.

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
* **Audit Logging:** Immutable administrative audit trail recording user IDs, actions, resource types, IP addresses, user agents, and change diffs.

### Candidate Portal
* **Candidate Dashboard:** Longitudinal score progress, overall accuracy, test completion rate, identified strong/weak topics, and recent scorecards.
* **Full Examination Mode:** Authentic examination simulations calibrated strictly to locked blueprints (e.g., 100 questions, 120 minutes, -0.25 negative marking).
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
* **Framework:** Next.js 15.1.7 (App Router, React Server Components by default)
* **Language:** TypeScript 5.7.3 (Strict Mode enabled, zero implicit `any`)
* **UI & Styling:** React 19, Tailwind CSS 3.4, Lucide React
* **Database:** MySQL 8.0
* **ORM:** Prisma ORM 6.4.1
* **AI Engine:** Google Gemini API (`@google/genai` server-side abstraction)
* **Storage:** Local Filesystem Storage (`LocalStorageProvider`)
* **Validation:** Zod 3.24
* **Testing:** Vitest 3.0 (Unit & Integration), Playwright 1.50 (E2E)

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
git clone <repository-url>
cd "Exam AI Mock Test"
```
*(Replace `<repository-url>` with your actual repository URL).*

### Step 4.2: Install Dependencies
```bash
# Clean install matching package-lock.json
npm ci
# Or standard install:
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

> [!NOTE]
> Use `npx prisma migrate dev` during local development. For production deployments, strictly use `npx prisma migrate deploy`.

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
# Start Next.js Development Server
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

For detailed architecture, restore commands, and security analysis, see [`docs/DATABASE_MANAGEMENT.md`](docs/DATABASE_MANAGEMENT.md).

---

## 14. High-Level System Workflows

### Administrator Exam Setup & Publishing Flow
```
Admin Login
    │
    ▼
Create Exam & Version (/admin/exams)
    │
    ▼
Upload Official Documents (/admin/notifications)
    │
    ▼
Trigger Gemini AI Extraction & Admin Verification
    │
    ▼
Configure Syllabus Hierarchy (/admin/exams/[id]/syllabus)
    │
    ▼
Define & Lock Exam Blueprint (/admin/blueprints)
    │
    ▼
Generate AI Question Bank (/admin/questions)
    │
    ▼
Generate Full Examination Mock (/admin/mock-tests)
    │
    ▼
11-Point Pattern Validation Engine Pass
    │
    ▼
Publish Mock Test & Monitor Candidate Attempts
```

### Candidate Examination & Practice Flow
```
Candidate Login (/login)
    │
    ▼
Candidate Dashboard (/candidate/dashboard)
    │
    ▼
Select Mock Test (/candidate/mock-tests)
    │
    ▼
Read Bilingual Instructions (/candidate/attempts/[id]/instructions)
    │
    ▼
Live Touch Exam Room (/candidate/attempts/[id])
    │
    ├─► Server-Authoritative Countdown Timer
    ├─► Real-Time Answer Autosave
    └─► Resilient Resume on Browser Refresh
    │
    ▼
Submit Examination
    │
    ▼
View Instant Scorecard & Explanations (/candidate/results/[id])
    │
    ├─► Retake Same Exam (Attempt 2, Attempt 3...)
    └─► Create Custom AI Practice Drill from Notes (/candidate/practice)
```

---

## 14. Command Reference Table

All scripts defined in `package.json`:

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js local development server at `http://localhost:3000` |
| `npm run build` | Compiles and builds the production-optimized Next.js application |
| `npm run start` | Starts the Next.js production server from `.next` build output |
| `npm run lint` | Runs ESLint across all TypeScript and React files |
| `npm run typecheck` | Executes TypeScript type checking (`tsc --noEmit`) without emitting files |
| `npm run check-translations` | Validates 100% parity across `messages/en.json` and `messages/hi.json` |
| `npm run test` | Runs the full Vitest unit and integration test suite |
| `npm run test:watch` | Starts Vitest in interactive watch mode for TDD |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests |
| `npm run prisma:generate` | Generates the Prisma Client TypeScript artifacts |
| `npm run prisma:migrate` | Runs Prisma schema migrations in development mode |
| `npm run prisma:seed` | Executes database seeding script (`prisma/seed.ts`) |

---

## 15. Troubleshooting Guide

| # | Symptom | Possible Cause | Solution |
|---|---|---|---|
| 1 | `Can't reach database server at 127.0.0.1:3306` | MySQL service is stopped or port is blocked | Start MySQL service (`net start MySQL80` on Windows or `sudo systemctl start mysql` on Linux). Verify credentials in `DATABASE_URL`. |
| 2 | `PrismaClientInitializationError` | Prisma Client not generated after schema changes | Run `npm run prisma:generate`. |
| 3 | `Translation parity check FAILED` | A translation key was added to `en.json` but missing in `hi.json` | Run `npm run check-translations` to identify the missing key, then update `messages/hi.json`. |
| 4 | `401 Unauthorized` on AI generation | `GEMINI_API_KEY` missing or invalid | Check `.env.local` for a valid `GEMINI_API_KEY`. Verify the key has Gemini API access enabled in Google AI Studio. |
| 5 | `EADDRINUSE: port 3000 already in use` | Another process is occupying port 3000 | Stop the existing process or run on another port: `npx next dev -p 3001`. |
| 6 | `Type error: Property does not exist on type` | TypeScript types out of sync with Prisma models | Run `npm run prisma:generate` followed by `npm run typecheck`. |
| 7 | `File upload error: ENOENT storage/private` | Storage directory missing or lacking permissions | The app automatically creates storage directories. Ensure user has write permissions to `./storage`. |
| 8 | `Next.js build fails on missing locale` | Route accessed without valid locale parameter | Access routes through canonical locale paths (`/en/...` or `/hi/...`). |
| 9 | `Maximum attempt limit reached` | Candidate has completed max attempts (10) for this mock | Expected security behavior. Candidate can create a new practice drill or admin can configure attempt limits. |
| 10 | `JWT expired / Invalid session token` | Session cookie expired | Clear cookies and log in again. Adjust `AUTH_EXPIRES_IN` in `.env.local` if needed. |
| 11 | `Failed to extract URL content (SSRF blocked)` | URL input matches private IP / localhost range | Security guard: Only public `http://` and `https://` educational domains are allowed. |
| 12 | `Cannot modify locked blueprint` | Attempting to edit a blueprint with status `LOCKED` | Create a new distinct Exam Version or Corrigendum. Locked blueprints are immutable by design. |

---

## 16. Development Database Reset Guide

If you need to reset your local development database to a clean initial state:

```bash
# WARNING: This completely wipes local database data and re-applies all migrations.
npx prisma migrate reset
```

> [!CAUTION]
> **NEVER** run `prisma migrate reset` in staging or production environments. Use only on local development machines.

---

## 17. GitHub Contribution Workflow

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

## 18. Project Directory Structure

```
Exam AI Mock Test/
├── AGENTS.md                   # Single source of truth & architectural rules
├── README.md                   # Primary developer guide & onboarding manual
├── package.json                # Project dependencies and script commands
├── prisma/
│   ├── schema.prisma           # MySQL 8 database models & relations
│   └── seed.ts                 # Initial database seeding script
├── messages/
│   ├── en.json                 # English translation dictionary
│   └── hi.json                 # Hindi translation dictionary
├── docs/
│   ├── ADMIN_APPLICATION_TOUR.html             # Standalone Admin HTML Tour
│   ├── CANDIDATE_APPLICATION_TOUR.html         # Standalone Candidate HTML Tour
│   ├── ADMIN_APPLICATION_TOUR_VIDEO_SCRIPT.md   # Admin Video Storyboard Script
│   └── CANDIDATE_APPLICATION_TOUR_VIDEO_SCRIPT.md # Candidate Video Storyboard Script
├── storage/                    # Local filesystem storage abstraction
│   ├── private/
│   │   ├── notifications/      # Uploaded official PDF notices
│   │   └── candidate-documents/# Candidate practice notes & files
│   └── public/
├── src/
│   ├── app/                    # Next.js App Router ([locale] & API routes)
│   │   ├── [locale]/           # Localized route trees
│   │   │   ├── admin/          # Administrator Console pages
│   │   │   └── candidate/      # Candidate Portal pages
│   │   ├── api/                # Server API endpoints
│   │   ├── layout.tsx          # Root HTML layout with LoadingProvider
│   │   └── globals.css         # Global Tailwind styles
│   ├── components/             # Reusable presentation components
│   │   ├── common/             # Language switcher, Global loader
│   │   ├── layouts/            # Sidebar, Nav, Headers
│   │   └── ui/                 # Accessible button, card, badge primitives
│   ├── lib/                    # Core utilities (Prisma, Auth, i18n, errors)
│   ├── modules/                # Domain schemas (Zod)
│   ├── services/               # Modular monolithic domain services
│   │   ├── ai/                 # Gemini question & document extraction
│   │   ├── attempt/            # Attempt lifecycle & timer synchronization
│   │   ├── mock/               # Mock generation & validation engine
│   │   ├── practice/           # Dynamic practice drills from resources
│   │   ├── rbac/               # Role-based access control
│   │   └── result/             # Scoring calculation engine
│   └── types/                  # Shared TypeScript interfaces
├── tests/
│   ├── unit/                   # Vitest unit test suites
│   ├── integration/            # Vitest integration test suites
│   └── e2e/                    # Playwright end-to-end test suites
└── scripts/
    └── check-translations.ts   # Automated translation parity checker
```

---

## 19. Security Guidelines

* **Server-Side AI Abstraction:** All Google Gemini API interactions execute exclusively on the server. Never expose API keys to the browser.
* **Role-Based Access Control:** Every API endpoint and server action validates session identity and granular permissions (`EXAM_CREATE`, `BLUEPRINT_LOCK`, `MOCK_PUBLISH`, etc.).
* **Private Storage Streaming:** Private documents (notifications, candidate notes) are never placed in the Next.js `public/` directory; they are streamed through authenticated, permission-checked route handlers.
* **Server-Authoritative Evaluation:** Scores, time limits, and answer keys are calculated strictly on the server. Zero client trust is maintained throughout the examination lifecycle.

---

## 20. License & Copyright

© 2026 **ExamPattern AI**. Built with Next.js App Router, MySQL 8, Prisma ORM, and Google Gemini AI. All Rights Reserved.
