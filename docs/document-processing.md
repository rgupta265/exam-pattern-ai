# Official Document Management & AI Extraction Pipeline

## Storage Security

All uploaded official notification documents, syllabi, and corrigendums are stored via `LocalStorageProvider` under the private storage partition:
```
storage/private/notifications/
```
Private files are streamed exclusively through authenticated and authorized streaming endpoints (`/api/files/[fileId]`) and are never placed in the Next.js `public/` directory.

---

## AI Extraction Pipeline

```
1. Document Upload (PDF, DOCX, TXT)
   └── SHA-256 Checksum & File Validation
         └── DocumentProcessingJob Created (Status: PENDING)
               └── Text & Structure Extraction
                     └── Server-Side GeminiProvider
                           └── Runtime Zod Validation (DocumentAnalysisResultSchema)
                                 └── Atomic Persistence:
                                       ├── DocumentProcessingJob (COMPLETED)
                                       ├── ExamBlueprint Draft (Status: AI_ANALYZED)
                                       ├── Syllabus Draft (Sections & Topics)
                                       └── ExamVersion Status (UNDER_REVIEW)
```

---

## Zod Schema Guarantees

All AI outputs must conform to `DocumentAnalysisResultSchema`:
- `examInfo`: examName, authority, postName, year, notificationNumber
- `pattern`: totalQuestions, totalMarks, durationMinutes, hasNegativeMarking, negativeMarkingRate, questionTypes, languages, instructions
- `sections`: array of extracted examination sections with question counts and marks
- `rules`: difficulty ratios and topic distributions
- `syllabus`: hierarchical sections, topics, subtopics, and weightages
- `sourceTraceability`: page numbers, excerpts, and confidence scores.
