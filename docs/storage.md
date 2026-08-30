# Local Storage Architecture — ExamPattern AI

## 1. Storage Layout

The platform uses local filesystem storage in V1 without cloud lock-in.

```
storage/
├── private/
│   ├── notifications/       # Official exam PDF notifications
│   ├── question-assets/     # Question diagrams and image attachments
│   ├── exports/             # Candidate scorecards and exported reports
│   └── candidate-documents/ # Candidate ID / verification files
└── public/
    └── avatars/             # Public profile avatars
```

---

## 2. Security Standards

1. **No Direct Public Exposure:**
   - Private storage paths are outside the Next.js `public/` directory.
   - Private files are streamed only through authorized route `/api/files/[fileId]`.
2. **Path Traversal Defense:**
   - All input paths are normalized and checked to prevent `../` escaping.
3. **Checksum Verification:**
   - SHA-256 hash computed and stored in the `files` table for every uploaded file.
4. **Disallowed Extensions Whitelist:**
   - Executables (`.exe`, `.bat`, `.sh`, `.php`, etc.) are blocked immediately.
