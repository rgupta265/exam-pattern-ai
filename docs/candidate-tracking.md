# Candidate Tracking & Practice Drill Architecture

## 1. Candidate Attempt Tracking

For official mock tests (`TestAttempt`), the system tracks the complete lifecycle:
- Session start time, submission time, duration, and IP/User-Agent.
- Question views, answer choices, revisions, and marked for review toggles.
- Real-time autosave on every answer change.
- Automated marks calculation, negative penalty deduction, and scorecard generation.
- Longitudinal performance analytics (`CandidateExamStatistic`, `CandidateTopicStatistic`).

---

## 2. Candidate Practice Drill System (Phase 8)

Phase 8 introduces the **Candidate Practice Generator** (`CandidatePracticeService`), providing candidate-created practice drills completely isolated from official exam attempts:

### Supported Practice Sources:
1. **Uploaded Document (`DOCUMENT`)**:
   - PDF, DOCX, PNG, JPG, JPEG, WEBP.
   - Files are stored privately under `private/candidate-documents/` using local filesystem abstraction.
   - Text extracted using `DocumentContentExtractor`.
2. **Pasted Study Notes (`TEXT`)**:
   - Textarea for notes, clinical summaries, or study articles (min 20 chars, max 500,000 chars).
3. **Safe Web URL (`URL`)**:
   - SSRF-protected URL content extraction (`UrlContentExtractorService`).
   - Blocks private/loopback/metadata IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254, ::1, etc.).
   - Enforces timeout (6s) and response size limits (2MB).
4. **Syllabus Topics (`TOPIC`)**:
   - Select topics using `SyllabusTreeSelector` with server-side validation against verified syllabus.

### Strict Practice / Official Mock Separation:
- **Dedicated Models**: `PracticeResource`, `PracticeTest`, `PracticeTestQuestion`, `PracticeQuestionOption`, `PracticeAttempt`, `PracticeAnswer`, `PracticeResult`.
- **Candidate Data Isolation**: Candidate A cannot access Candidate B's resources, practice tests, or scorecards.
- **Analytics Isolation**: Practice drill attempts and results do **NOT** modify or contaminate official `CandidateExamStatistic`, `TestResult`, or exam percentile rankings.

---

## 3. Practice Test Taking Experience

- Dedicated responsive touch interface at `/candidate/practice/[practiceTestId]/attempt`.
- Resilient countdown timer with server auto-submit on expiry.
- Question palette (drawer on mobile, side panel on desktop).
- Mark for review, clear answer, next/previous controls.
- Autosave on answer change.
- Immediate practice scorecard and question-by-question review with Gemini diagnostic insights.
