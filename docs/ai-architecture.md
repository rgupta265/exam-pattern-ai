# AI Architecture & Scope Boundaries

## 1. Core Principles

- **Server-Side Only**: All calls to Google Gemini (`geminiProvider`, `geminiQuestionService`, etc.) execute strictly on the server.
- **Strict Scope Boundaries (`AIScopeGuard`)**: Gemini AI is never used as an open-ended general chatbot. It is strictly bounded by structured `AIContext` and verified syllabus nodes.
- **Authoritative Blueprints**: Gemini AI generates question content but **never** dictates question counts, sectional divisions, duration, or negative marking penalties.

---

## 2. Phase 8 Capabilities

### 1. Document Context Isolation
- When generating questions for an ExamVersion (e.g. Health Officer 2026), Gemini only receives verified documents belonging to that exact version ID.

### 2. SSRF-Safe Web Content Extraction (`UrlContentExtractorService`)
- Candidate practice generation allows providing public web URLs.
- Protected by strict SSRF defense:
  - Protocol whitelist (`http:`, `https:`).
  - DNS resolution check against all private/loopback/link-local/carrier NAT IPv4 and IPv6 ranges.
  - Blocks cloud metadata addresses (`169.254.169.254`, `metadata.google.internal`, etc.).
  - Manual redirect following (re-verifying destination DNS/IP at every hop, max 3 redirects).
  - Response size limit (2MB) and timeout limit (6s).

### 3. Multi-Syllabus Selection Validation (`SyllabusSelectionService`)
- Validates that every topic selected by client exists in the verified syllabus of the designated `ExamVersion`.
- Prevents cross-exam and arbitrary topic injection.

### 4. Bounded Question Generation Modes
- `SOURCE_ONLY`: Gemini generates factual questions drawn strictly from the provided source text/document.
- `EXAM_CONTEXT_ASSISTED`: Gemini synthesizes concepts from the source material with the official exam syllabus.
