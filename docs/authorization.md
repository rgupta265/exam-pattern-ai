# Authorization & RBAC Architecture — ExamPattern AI

## 1. Multi-Layer Enforcement Principle

Authorization is enforced at multiple independent layers:

```
Incoming Request
  └── 1. Next.js Middleware (Route & Role Protection)
        └── 2. Route Handlers / Server Actions (RbacService.requirePermission)
              └── 3. Domain Service Validation (Data Ownership & Integrity)
                    └── 4. Database Transaction
```

---

## 2. Roles Matrix

| Role | Description | Core Responsibilities |
|---|---|---|
| `SUPER_ADMIN` | Root administrator | Implicit full permissions across all entities |
| `ADMIN` | Subject administrator | Exam creation, document AI processing, blueprint verification and locking |
| `QUESTION_REVIEWER` | Reviewer | Question bank inspection, review queue decisions |
| `CANDIDATE` | Test candidate | Attempting mock tests, viewing own scores, isolated data access |

---

## 3. Granular Permissions

```typescript
// Example usage in services:
RbacService.requirePermission(user, PERMISSIONS.BLUEPRINT_LOCK);
```

Default permissions include:
* `EXAM_VIEW`, `EXAM_CREATE`, `EXAM_UPDATE`, `EXAM_DELETE`
* `DOCUMENT_VIEW`, `DOCUMENT_UPLOAD`, `DOCUMENT_PROCESS`
* `BLUEPRINT_VIEW`, `BLUEPRINT_UPDATE`, `BLUEPRINT_VERIFY`, `BLUEPRINT_LOCK`
* `QUESTION_VIEW`, `QUESTION_CREATE`, `QUESTION_UPDATE`, `QUESTION_REVIEW`, `QUESTION_APPROVE`
* `MOCK_VIEW`, `MOCK_CREATE`, `MOCK_PUBLISH`
* `CANDIDATE_VIEW`, `CANDIDATE_ATTEMPT_VIEW`, `CANDIDATE_RESULT_VIEW`, `CANDIDATE_PERFORMANCE_VIEW`
* `AUDIT_LOG_VIEW`
* `CANDIDATE_SELF_ATTEMPT`, `CANDIDATE_SELF_VIEW`

---

## 4. Tenant & Candidate Isolation Rule
* Candidates can **never** query or view records belonging to other candidates.
* All candidate data queries must enforce `where: { candidateId: session.id }`.
