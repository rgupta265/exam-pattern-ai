# ExamPattern AI — Production Security & Vulnerability Audit Report

> **Document Version:** 1.0.0 (Phase 14 Production Hardening)  
> **Platform:** ExamPattern AI Modular Monolith  
> **Date:** August 2026  
> **Audit Status:** Complete & Verified

---

## 1. Executive Summary

ExamPattern AI has undergone a comprehensive production security, architectural authorization, and vulnerability audit. This audit evaluated authentication lifecycles, role-based access control (RBAC), multi-tenant candidate data isolation, Server-Side Request Forgery (SSRF) defense, Insecure Direct Object References (IDOR), Path Traversal defenses, AI scope and prompt boundary integrity, private storage streaming, and dependency hygiene.

All critical and high-priority application-level vulnerabilities have been remediated. The platform enforces **Zero Client Trust**: scores, timer limits, authorization scopes, AI question counts, and file access permissions are strictly calculated and validated server-side.

---

## 2. Threat Model & Trust Boundaries

```
[ Public Client / Browser / Mobile Touch UX ]
                     │  (HTTPS / Canonical /en & /hi Locale URLs)
                     ▼
[ Next.js Middleware: Edge Token Check & Security Headers ]
                     │  (X-Content-Type-Options, FrameGuard, Referrer-Policy)
                     ▼
[ App Router & API Route Handlers: Server Authorization & Zod Validation ]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
[ Domain Service Layer ]   [ Controlled Gemini AI Abstraction ]
  ├─ AuthService             └─ Server-only API Key
  ├─ AttemptService (IDOR)      └─ Locked Blueprint Bounds
  ├─ MockService
  ├─ TourVideoService (Storage)
  └─ UrlExtractor (SSRF Guard)
         │
         ▼
[ MySQL 8 Database (Prisma ORM Parameterization) & Private Filesystem Storage ]
```

### Trust Boundary Rules:
1. **Client is Untrusted:** The client never computes scores, never selects exam patterns, and cannot elevate roles.
2. **AI is Assistive, Not Authoritative:** Gemini never dictates exam duration, question marks, or negative penalty values; these are derived strictly from locked blueprints.
3. **Storage Isolation:** Private files (notifications, candidate study notes, tour videos) are stored outside `public/` and streamed only through authenticated, permission-checked route handlers.

---

## 3. Security Analysis by Subsystem

### 3.1 Authentication & Session Management
* **Password Storage:** Passwords are encrypted using `bcryptjs` with salt factor 10. Plaintext passwords and hashes are never returned in API responses.
* **Session Architecture:** Stateless JSON Web Tokens (JWT) signed using HMAC-SHA256 (`jose` library) stored in secure HTTP-only cookies (`auth_token`).
* **Cookie Security:** Flags set to `HttpOnly: true`, `SameSite: "lax"`, and `Secure: true` in production environments (`NODE_ENV === "production"`).
* **Role Tampering Protection:** The public registration endpoint (`POST /api/auth/register`) strictly sets role `CANDIDATE`. Incoming payloads attempting to pass `role: "ADMIN"` or `isAdmin: true` are discarded by allowlisted Zod parsing.

### 3.2 Authorization & RBAC
* **Multi-Layer Enforcement:**
  1. *Middleware Layer (`src/middleware.ts`):* Intercepts all `/admin` and `/api/admin` requests, verifying `SUPER_ADMIN`, `ADMIN`, or `QUESTION_REVIEWER` roles. Unauthorized candidate sessions are redirected to `/[locale]/forbidden`.
  2. *Domain Service Layer:* Every business action checks session identity and user ownership (e.g., `attempt.candidateId === sessionUser.id`).
* **Candidate Data Isolation:** Candidate A cannot view Candidate B's attempts, scorecards, practice notes, or generated drills.

### 3.3 Insecure Direct Object References (IDOR)
* **Attempt Access:** `AttemptService.getAttempt(attemptId, candidateId)` validates that the requesting user matches the attempt's `candidateId`. Administrators can audit attempts via dedicated administrative routes.
* **Result Access:** `ResultService.getResult(resultId, candidateId)` verifies ownership before returning detailed question analytics.
* **Practice Drills:** Practice tests and resources require candidate ownership verification.

### 3.4 Server-Side Request Forgery (SSRF) Defense
* **Risk Context:** The Candidate Practice module allows candidates to provide educational URLs for question generation.
* **SSRF Guard (`src/services/practice/url-extractor.service.ts`):**
  - Protocol whitelist: Only `http:` and `https:` schemes allowed (`file:`, `gopher:`, `ftp:` blocked).
  - Private IP & Hostname blocklist: Prohibits `localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` (cloud metadata), `0.0.0.0`, and IPv6 loopbacks (`::1`).
  - Response size limit: Maximum 5MB fetched per URL to prevent memory exhaustion attacks.

### 3.5 Path Traversal & File Upload Security
* **Storage Location:** All uploaded files are stored under `./storage/private/` (never in `public/`).
* **Filename Sanitization:** Uploaded files receive server-generated UUID filenames (`uuidv4() + ext`). Original filenames are stored as metadata only.
* **Path Boundary Check:** Before reading or streaming any file, the service normalizes target paths and verifies `normalizedTarget.startsWith(normalizedStorageDir)`.
* **MIME & Extension Validation:**
  - Documents: PDF, DOCX, TXT.
  - Tour Videos: `video/mp4`, `video/webm`, `video/quicktime` (`.mp4`, `.webm`, `.mov`), max 100MB.

### 3.6 Application Tour Video Storage & Streaming
* **Storage:** Videos are saved in `./storage/private/application-tours/`.
* **Streaming Endpoint (`GET /api/application-tour/videos/[id]/stream`):**
  - Verifies authentication and role permissions.
  - Candidates can only stream published `CANDIDATE_END_TOUR` videos.
  - Implements HTTP 206 Partial Content (Range requests: `bytes=start-end`) for smooth mobile video playback and seeking.
  - Prevents unpublished or admin tour video leakage.

### 3.7 AI Scope & Prompt Injection Security
* **Scope Guard:** Candidates cannot pass arbitrary exam configurations to Gemini. Question generation is strictly bounded by syllabus nodes extracted from verified documents.
* **Prompt Injection Resilience:** Uploaded text/documents are passed to Gemini as data blocks enclosed in delimiters. System prompts instruct the model to treat input as content only, preventing prompt override attacks.
* **Server-Authoritative Evaluation:** Candidate scores, accuracy, and negative penalties are calculated using database records, never by asking AI to score an exam.

---

## 4. API Security Matrix

| Endpoint | Auth Required | Allowed Roles | Resource Ownership Check | Input Validation | Sensitive Data Filtered |
|---|---|---|---|---|---|
| `POST /api/auth/register` | No | Public | N/A | `registerSchema` (Zod) | Passwords hashed |
| `POST /api/auth/login` | No | Public | N/A | `loginSchema` (Zod) | Passwords omitted |
| `POST /api/auth/logout` | No | Public | N/A | N/A | Session cookie cleared |
| `GET /api/auth/me` | Yes | All | Current session | N/A | Passwords omitted |
| `GET /api/admin/tour-videos` | Yes | SuperAdmin, Admin | N/A (Admin pool) | N/A | Full video metadata |
| `POST /api/admin/tour-videos` | Yes | SuperAdmin, Admin | N/A | MIME, Size (100MB), Ext | Stored in private storage |
| `PUT /api/admin/tour-videos/[id]/publish` | Yes | SuperAdmin, Admin | N/A | Boolean `isPublished` | N/A |
| `DELETE /api/admin/tour-videos/[id]` | Yes | SuperAdmin, Admin | N/A | Video ID | File unlinked safely |
| `GET /api/application-tour/videos/active` | Yes | All | Role-filtered | Type, Locale query | Unpublished hidden from Candidate |
| `GET /api/application-tour/videos/[id]/stream` | Yes | All | Role-filtered | Video ID, Range header | HTTP 206 Partial Content |
| `GET /api/candidate/attempts/[id]` | Yes | Candidate | Candidate ID matches | UUID | Unanswered keys hidden during test |
| `POST /api/candidate/attempts/[id]/submit` | Yes | Candidate | Candidate ID matches | UUID | Net score calculated server-side |
| `GET /api/candidate/results/[id]` | Yes | Candidate | Candidate ID matches | UUID | Scorecard & explanations |
| `POST /api/candidate/practice/generate` | Yes | Candidate | Candidate ID matches | `generatePracticeSchema` | Context-bounded |
| `POST /api/url-extract` | Yes | Candidate | Candidate ID matches | `urlExtractSchema` | SSRF guarded |

---

## 5. Security Vulnerability Findings & Status

| # | Severity | Finding | Impact | Status | Remediation |
|---|---|---|---|---|---|
| 1 | **HIGH** | Candidate users seeded in database by default | Exposure of test candidate credentials in production-like environments | **RESOLVED** | Removed candidate seed; only Admin initialized via environment variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). |
| 2 | **HIGH** | Legacy `/docs/CANDIDATE_APPLICATION_TOUR.html` path accessible via URL | Broken link and potential direct filesystem path exposure | **RESOLVED** | Added middleware redirect to canonical application routes (`/[locale]/candidate/application-tour`). Raw docs routes blocked. |
| 3 | **MEDIUM** | Tour videos unmanaged and unauthenticated | Risk of exposing unpublished walkthroughs or internal systems | **RESOLVED** | Implemented `TourVideoService` with private filesystem storage, role checks, and HTTP 206 streaming endpoint. |
| 4 | **MEDIUM** | Missing HTTP Security Headers on static/public routes | Potential clickjacking or MIME-sniffing risks | **RESOLVED** | Added `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and `Permissions-Policy` in middleware. |
| 5 | **LOW** | Home page forced login on already authenticated users | UX friction; potential session confusion | **RESOLVED** | Server-authoritative session check on home page displaying direct "Go to Admin Dashboard" or "Go to Candidate Dashboard" actions. |
| 6 | **INFO** | Dev/build dependency warnings in `postcss` and `sharp` via Next.js toolchain | Build-time toolchain notices; does not affect runtime application API security | **DOCUMENTED** | Monitored; will upgrade cleanly with Next.js minor release without breaking changes. |

---

## 6. Secret Scanning & Dependency Audit Results

* **Secret Scanner:** Automated repository scan found **0** exposed Google Gemini API keys, **0** private keys, and **0** production credentials in source code.
* **Dependency Audit (`npm audit`):** Runtime packages (`jose`, `bcryptjs`, `@prisma/client`, `zod`) have **0** critical/high vulnerabilities.

---

## 7. Security Verification Commands

```bash
# 1. Translation Parity
npm run check-translations

# 2. TypeScript Typecheck
npm run typecheck

# 3. ESLint Quality Check
npm run lint

# 4. Vitest Unit & Integration Security Test Suite
npm run test

# 5. Production Compilation
npm run build
```
