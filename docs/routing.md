# Routing Architecture & Localization

## App Router Structure

The platform uses Next.js App Router with modular directory structures:

### Public & Auth Routes:
* `/[locale]/login` (or `/login`)
* `/[locale]/register` (or `/register`)
* `/[locale]/forgot-password` (or `/forgot-password`)
* `/[locale]/forbidden` (or `/forbidden`)

### Candidate Portal Routes:
* `/[locale]/candidate/dashboard`
* `/[locale]/candidate/exams`
* `/[locale]/candidate/exams/[examId]`
* `/[locale]/candidate/mock-tests`
* `/[locale]/candidate/mock-tests/[mockTestId]`
* `/[locale]/candidate/attempts/[attemptId]`
* `/[locale]/candidate/practice` *(Phase 8)*
* `/[locale]/candidate/practice/create` *(Phase 8)*
* `/[locale]/candidate/practice/[practiceTestId]` *(Phase 8)*
* `/[locale]/candidate/practice/[practiceTestId]/attempt` *(Phase 8)*
* `/[locale]/candidate/practice/results/[resultId]` *(Phase 8)*
* `/[locale]/candidate/results`
* `/[locale]/candidate/results/[resultId]`
* `/[locale]/candidate/performance`
* `/[locale]/candidate/profile`
* `/[locale]/candidate/settings`

### Admin Portal Routes:
* `/[locale]/admin/dashboard`
* `/[locale]/admin/exams`
* `/[locale]/admin/exams/[examId]`
* `/[locale]/admin/exams/[examId]/documents` *(Phase 8 Readiness & Verification)*
* `/[locale]/admin/exams/[examId]/blueprint`
* `/[locale]/admin/exams/[examId]/syllabus`
* `/[locale]/admin/exams/[examId]/mock-tests`
* `/[locale]/admin/exams/[examId]/mock-tests/create` *(Phase 8 One-Click Actual Pattern)*
* `/[locale]/admin/candidates`
* `/[locale]/admin/candidates/[candidateId]`
* `/[locale]/admin/audit-logs`
* `/[locale]/admin/ai-generation`

---

## Complete Locale Routing (`/en` and `/hi`)

In Phase 8:
- Next.js middleware automatically detects `/en` or `/hi` prefixes on all public, candidate, and admin routes.
- Rewrites internal requests to underlying page components while propagating the `x-locale` header and `NEXT_LOCALE` cookie.
- `LanguageSwitcher` dynamically rewrites the URL pathname between `/en/...` and `/hi/...` while preserving dynamic route segments and query string parameters.
- Active exam taking language (`attemptLanguage`) is preserved during UI language switching.
