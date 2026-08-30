# Strict AI Scope Control & Guard Architecture

## 1. Principles
Google Gemini operates strictly as an application engine bounded by official exam context. It is **never** exposed as an unrestricted chatbot.

```
Incoming Request
  └── AIScopeGuard Pre-Validation (Server-Side)
        ├── Task Type Check (12 Explicit Tasks)
        ├── Syllabus Topic Boundary Check
        ├── Blueprint Marking & Duration Compliance
        ├── Batch Limits (<= 100 Qs)
        └── Source Material Relevance
              └── Gemini API Service Layer
                    └── Zod Schema & Business Validation
                          └── Persistence
```

## 2. Permitted AI Task Types
1. `DOCUMENT_ANALYSIS`
2. `EXAM_PATTERN_EXTRACTION`
3. `SYLLABUS_EXTRACTION`
4. `QUESTION_GENERATION`
5. `QUESTION_VALIDATION`
6. `MOCK_GENERATION`
7. `MOCK_VALIDATION`
8. `PERFORMANCE_ANALYSIS`
9. `QUESTION_EXPLANATION`
10. `TRANSLATION`
11. `SOURCE_RELEVANCE_CHECK`
12. `AI_SUGGESTIONS`

## 3. Out-of-Scope Enforcement
* Requests for topics outside the verified syllabus (e.g. asking for Cricket questions on a Health Officer exam) are rejected immediately prior to invoking Gemini.
* Rate limits are enforced on a per-user sliding window to protect API quotas.
