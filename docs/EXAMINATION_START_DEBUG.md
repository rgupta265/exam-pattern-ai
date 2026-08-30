# Examination Start & Initialization Loop Debug Report — ExamPattern AI

## 1. Original Issue
When a candidate clicked **"Start Examination"** on a mock test, the screen displayed `"Initializing Examination..."` (or loading spinner). Once the loading finished, the application looped and returned the candidate right back to `/candidate/mock-tests` instead of rendering the live examination room.

---

## 2. Reproduction Steps
1. Log in as a Candidate account.
2. Navigate to `/en/candidate/mock-tests` (or `/hi/candidate/mock-tests`).
3. Click **"Start Examination"** on a published mock test (e.g. `UPHO-2026-MOCK-001`).
4. Observe the global loading state `"Preparing your examination room..."`.
5. When the route transitioned to `/candidate/attempts/[attemptId]`, the screen immediately kicked the candidate back to `/candidate/mock-tests`.

---

## 3. Root Cause Analysis
The failure was caused by a **data payload shape mismatch** between the backend service and the candidate exam room frontend component:

1. **Backend Service (`AttemptService.getAttemptForExam`):**
   The endpoint `/api/candidate/attempts/[attemptId]` returned `{ success: true, data: { attempt, remainingSeconds, isExpired, resultId } }`, where `attempt.mockTest` contained the examination sections and questions.

2. **Frontend Expectation (`src/app/candidate/attempts/[attemptId]/page.tsx`):**
   The component tried to read `const mock = data.data.mockTest;`. Because `mockTest` was inside `data.data.attempt`, `data.data.mockTest` evaluated to `undefined`.

3. **Unhandled TypeError in `loadAttempt`:**
   Evaluating `mock.title` and `mock.sections` threw an unhandled `TypeError: Cannot read properties of undefined (reading 'sections')`.

4. **Silent Fallback Redirect:**
   The `catch` block in `loadAttempt` caught the `TypeError` and executed `router.replace(localizePath("/candidate/mock-tests", locale))`. This immediately ejected the candidate from the exam room and sent them back to the mock list, creating the initialization loop appearance.

---

## 4. Affected Components & Services
* **Backend:** `src/services/attempt/attempt.service.ts` (`getAttemptForExam`)
* **Frontend Exam Room:** `src/app/candidate/attempts/[attemptId]/page.tsx`
* **Frontend Mock List:** `src/app/candidate/mock-tests/page.tsx`
* **Frontend Start Button:** `src/app/candidate/mock-tests/[mockTestId]/start-button.tsx`

---

## 5. Fixes Implemented

1. **Payload Structure Alignment:**
   Updated `AttemptService.getAttemptForExam` to return both `attempt` and top-level `mockTest: attempt.mockTest`.

2. **Resilient Frontend Extraction:**
   Updated `src/app/candidate/attempts/[attemptId]/page.tsx` to read `const mock = data.data.mockTest || data.data.attempt?.mockTest;` with defensive checks for `sections`.

3. **Dedicated Error State & UI:**
   Replaced silent `router.replace("/candidate/mock-tests")` with an explicit `error` state in `src/app/candidate/attempts/[attemptId]/page.tsx`. If an API or network error occurs, a clear error dialog is presented with **Retry** and **Back to Mock Tests** buttons.

4. **Start Button ID Resolution:**
   Updated `handleStartExam` in `src/app/candidate/mock-tests/page.tsx` to resolve `attemptId` from `json.data?.id || json.data?.attempt?.id` and display an error alert if creation fails.

5. **Hook Dependency Memoization:**
   Memoized `handleSubmit` and `handleAutoSubmit` with `useCallback` in `src/app/candidate/attempts/[attemptId]/page.tsx` to eliminate React lifecycle warnings.

---

## 6. Security Considerations
* **Server-Side Authorization:** Candidate ownership is verified server-side (`attempt.candidateId === session.id`). Non-owners are strictly blocked with HTTP 403 `ForbiddenError`.
* **Answer Key Stripping:** Correct answers and `isCorrect` booleans are stripped from question options during live attempts.
* **Server-Authoritative Timer:** Time remaining is calculated on the server from `startedAt` and `durationMinutes`. Expired attempts are automatically auto-submitted.

---

## 7. Verification Tests Performed
* **Trace Script (`scripts/test-exam-start.ts`):** Verified full attempt creation, instruction acknowledgment, and live exam room data retrieval.
* **Unit Tests (`tests/unit/phase17-exam-initialization-fix.test.ts`):** 4 test cases covering payload structure, ownership security, 404 handling, and draft mock rejection.
* **Full Suite Run:** 43 test files, 174/174 unit and integration tests passed.
* **Production Build:** `npm run build` compiled successfully in 13.9s across all 95 routes.
