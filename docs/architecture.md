# System Architecture — ExamPattern AI

## 1. Architectural Overview

ExamPattern AI is designed as a high-performance **modular monolith** using the Next.js App Router and TypeScript. It strictly avoids premature microservices in V1 while maintaining clear domain boundaries.

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
│        (Server Components by Default / Touch UI)       │
└────────────┬─────────────────────────────┬─────────────┘
             │ (Middleware Route Guard)    │
             ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│      Candidate Portal    │  │       Admin Console      │
│  /candidate/*            │  │  /admin/*                │
└────────────┬─────────────┘  └────────────┬─────────────┘
             │                             │
             └──────────────┬──────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Domain Services                    │
│   AuthService · RbacService · StorageService · Audit   │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
             ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    Local Filesystem      │  │     MySQL 8 (Prisma)     │
│    Storage Provider      │  │     38 Entity Models     │
└──────────────────────────┘  └──────────────────────────┘
```

---

## 2. Layer Responsibilities

1. **Presentation Layer (`src/app/`, `src/components/`):**
   - React Server Components (RSC) for page trees, static metadata, and server data fetching.
   - Client components strictly reserved for touch controls, exam timers, answer interactions, and drawers.
   - Mobile-first responsive layouts across `360×640` to `1920×1080` screen sizes.

2. **Routing & Filtering Layer (`src/middleware.ts`):**
   - Intercepts incoming requests.
   - Validates JWT tokens and cookies at edge-speed using `jose`.
   - Protects `/admin/*` and `/candidate/*` routes.

3. **Domain Service Layer (`src/services/`):**
   - Enforces business rules and authorization before mutating data.
   - All critical operations call `RbacService.requirePermission(...)`.
   - Encapsulates database transactions via Prisma.

4. **Persistence & Storage Layer (`src/lib/prisma.ts`, `src/services/storage/`):**
   - MySQL 8 database with strict indexing, foreign keys, and soft deletion.
   - Filesystem storage with checksum SHA-256 verification and path traversal defenses.
