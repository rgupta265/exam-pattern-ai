# Database Architecture & Schema — ExamPattern AI

## 1. Engine & ORM Directives
* **Database:** MySQL 8.0 strictly.
* **ORM:** Prisma ORM with `@prisma/client`.
* **Primary Key Strategy:** UUIDs (`@default(uuid())`) for all entities to prevent sequential ID exposure.
* **Integrity:** Foreign keys on all parent-child relationships, composite unique constraints, and soft deletion (`deletedAt`).

---

## 2. Entity Groups (Phase 1 Implemented Models)

### Group 1: Auth & RBAC
* `users`: Candidate and admin accounts with status and hashed passwords.
* `roles`: System roles (`SUPER_ADMIN`, `ADMIN`, `QUESTION_REVIEWER`, `CANDIDATE`).
* `permissions`: Fine-grained permission strings across modules.
* `user_roles`: Multi-role assignment join table.
* `role_permissions`: Role-to-permission mapping table.

### Group 2: Exam & Blueprint Hierarchy
* `exam_categories`: Top-level groupings (Government, Medical, Banking, Engineering).
* `exams`: Specific examinations (e.g., "UP Health Officer", "GATE CSE").
* `exam_versions`: Annual notification cycles with corrigendum tracking.
* `exam_documents`: Uploaded official PDF notifications, syllabi, and answer keys.
* `document_processing_jobs`: Gemini extraction jobs and structured JSON outputs.
* `exam_blueprints`: Official exam blueprints with immutable locking lifecycle.
* `blueprint_sections`: Section-by-section breakdown (questions, marks, negative rate).
* `blueprint_rules`: Distribution constraints (difficulty ratios, topic tolerances).

### Group 3: Verified Syllabus
* `syllabi`: Versioned syllabus containers.
* `syllabus_sections`: Subject/Section chapters.
* `syllabus_topics`: Granular syllabus nodes with target weightages.

### Group 4: Question Bank & Reviews
* `questions`: Questions with Hindi/English text, options, explanations, and difficulty.
* `question_options`: MCQ options (`A`, `B`, `C`, `D`) with correctness flags.
* `question_ai_generations`: AI prompt, raw Gemini response, and token audit logs.
* `question_reviews`: Multi-reviewer decision and feedback history.

### Group 5: Mock Tests & Validation Engine
* `mock_tests`: Generated mock tests linked to blueprints.
* `mock_test_sections`: Sections within a mock test.
* `mock_test_questions`: Questions ordered and mapped into mock tests.
* `mock_generation_requests`: Dynamic generation request records.
* `mock_validation_results`: 100% blueprint compliance validation reports.

### Group 6: Candidate Attempts & Tracking
* `test_attempts`: Live attempt lifecycle (`IN_PROGRESS`, `SUBMITTED`, `AUTO_SUBMITTED`).
* `test_answers`: Candidate answer state per question.
* `answer_events`: Granular revision stream (select, change, clear, review).
* `attempt_events`: Heartbeat, section switch, pause, resume, submit events.

### Group 7: Results & Statistics
* `test_results`: Final scorecards, net scores, penalties, and Gemini feedback.
* `section_results`: Section-wise score and accuracy breakdown.
* `topic_results`: Topic-wise score and weak-point analysis.
* `question_results`: Per-item correctness and time spent.
* `candidate_exam_statistics`: Longitudinal exam trends for candidates.
* `candidate_topic_statistics`: Topic mastery, identifying strong vs. weak topics.
* `question_statistics`: Aggregate question discrimination and accuracy stats.

### Group 8: Storage & Auditing
* `files`: Metadata, checksum SHA-256, and storage paths.
* `audit_logs`: Immutable audit trails for all administrative operations.
