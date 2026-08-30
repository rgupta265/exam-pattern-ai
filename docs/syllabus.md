# Verified Syllabus Hierarchy & Topic Architecture

## Hierarchy

```
ExamVersion
  └── Syllabus (isVerified: boolean, verifiedById, verifiedAt)
        └── SyllabusSection (name, code, description, sortOrder)
              └── SyllabusTopic (name, code, description, weightagePercentage, sortOrder)
```

---

## Modality Compliance Rule

In Phase 3 and Phase 4:
- **Full Exam Mocks** map 100% of questions across the verified syllabus tree.
- **Topic Practice Mocks** must validate that the requested topic exists in the verified syllabus before AI generation is allowed.
- Candidates cannot submit arbitrary, unverified topics.

---

## Admin Verification

The `SyllabusService.verifySyllabus` workflow marks the syllabus verified (`isVerified = true`), records the reviewing administrator's user ID and timestamp, and writes to the audit log.
