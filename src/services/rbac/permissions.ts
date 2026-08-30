import { PERMISSIONS, UserRole, PermissionCode } from "@/lib/constants";

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  module: string;
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Exam Category Module
  { code: PERMISSIONS.EXAM_CATEGORY_VIEW, name: "View Categories", module: "ExamCategory", description: "View exam categories" },
  { code: PERMISSIONS.EXAM_CATEGORY_CREATE, name: "Create Category", module: "ExamCategory", description: "Create exam categories" },
  { code: PERMISSIONS.EXAM_CATEGORY_UPDATE, name: "Update Category", module: "ExamCategory", description: "Edit exam categories" },
  { code: PERMISSIONS.EXAM_CATEGORY_DELETE, name: "Delete Category", module: "ExamCategory", description: "Delete/archive exam categories" },

  // Exam Module
  { code: PERMISSIONS.EXAM_VIEW, name: "View Exams", module: "Exam", description: "View exam listings and details" },
  { code: PERMISSIONS.EXAM_CREATE, name: "Create Exam", module: "Exam", description: "Create new exams and versions" },
  { code: PERMISSIONS.EXAM_UPDATE, name: "Update Exam", module: "Exam", description: "Edit existing exams and versions" },
  { code: PERMISSIONS.EXAM_DELETE, name: "Delete Exam", module: "Exam", description: "Delete exams or versions" },

  // Document Module
  { code: PERMISSIONS.DOCUMENT_VIEW, name: "View Documents", module: "Document", description: "View uploaded official documents" },
  { code: PERMISSIONS.DOCUMENT_UPLOAD, name: "Upload Documents", module: "Document", description: "Upload official exam notifications/syllabi" },
  { code: PERMISSIONS.DOCUMENT_PROCESS, name: "Process Documents", module: "Document", description: "Trigger Gemini AI extraction on documents" },

  // Blueprint Module
  { code: PERMISSIONS.BLUEPRINT_VIEW, name: "View Blueprint", module: "Blueprint", description: "View exam blueprint structure" },
  { code: PERMISSIONS.BLUEPRINT_UPDATE, name: "Update Blueprint", module: "Blueprint", description: "Edit draft exam blueprint" },
  { code: PERMISSIONS.BLUEPRINT_VERIFY, name: "Verify Blueprint", module: "Blueprint", description: "Mark blueprint as verified by admin" },
  { code: PERMISSIONS.BLUEPRINT_LOCK, name: "Lock Blueprint", module: "Blueprint", description: "Lock verified blueprint (immutable)" },
  { code: PERMISSIONS.BLUEPRINT_ACTIVATE, name: "Activate Blueprint", module: "Blueprint", description: "Activate blueprint for candidate mock tests" },

  // Syllabus Module
  { code: PERMISSIONS.SYLLABUS_VIEW, name: "View Syllabus", module: "Syllabus", description: "View exam syllabus hierarchy" },
  { code: PERMISSIONS.SYLLABUS_CREATE, name: "Create Syllabus Topic", module: "Syllabus", description: "Add syllabus sections and topics" },
  { code: PERMISSIONS.SYLLABUS_UPDATE, name: "Update Syllabus Topic", module: "Syllabus", description: "Edit syllabus sections and topics" },
  { code: PERMISSIONS.SYLLABUS_VERIFY, name: "Verify Syllabus", module: "Syllabus", description: "Verify official syllabus structure" },
  { code: PERMISSIONS.SYLLABUS_DELETE, name: "Delete Syllabus Topic", module: "Syllabus", description: "Delete/archive syllabus topics" },

  // Question Module
  { code: PERMISSIONS.QUESTION_VIEW, name: "View Questions", module: "Question", description: "View question bank" },
  { code: PERMISSIONS.QUESTION_CREATE, name: "Create Question", module: "Question", description: "Create or AI-generate questions" },
  { code: PERMISSIONS.QUESTION_UPDATE, name: "Update Question", module: "Question", description: "Edit questions in draft/review" },
  { code: PERMISSIONS.QUESTION_REVIEW, name: "Review Question", module: "Question", description: "Submit reviews for questions" },
  { code: PERMISSIONS.QUESTION_APPROVE, name: "Approve Question", module: "Question", description: "Approve questions into verified pool" },

  // Mock Test Module
  { code: PERMISSIONS.MOCK_VIEW, name: "View Mock Tests", module: "MockTest", description: "View mock test configurations" },
  { code: PERMISSIONS.MOCK_CREATE, name: "Create Mock Test", module: "MockTest", description: "Generate mock test from blueprint" },
  { code: PERMISSIONS.MOCK_PUBLISH, name: "Publish Mock Test", module: "MockTest", description: "Publish validated mock tests" },

  // Candidate Visibility & Tracking
  { code: PERMISSIONS.CANDIDATE_VIEW, name: "View Candidates", module: "Candidate", description: "View registered candidates" },
  { code: PERMISSIONS.CANDIDATE_ATTEMPT_VIEW, name: "View Candidate Attempts", module: "Candidate", description: "View candidate attempt logs" },
  { code: PERMISSIONS.CANDIDATE_RESULT_VIEW, name: "View Candidate Results", module: "Candidate", description: "View candidate scorecards" },
  { code: PERMISSIONS.CANDIDATE_PERFORMANCE_VIEW, name: "View Candidate Performance", module: "Candidate", description: "View candidate diagnostic analytics" },
  { code: PERMISSIONS.CANDIDATE_ACTIVITY_VIEW, name: "View Candidate Activity", module: "Candidate", description: "View candidate real-time interaction logs" },

  // General Attempt, Result & Performance permissions
  { code: PERMISSIONS.ATTEMPT_VIEW, name: "View Test Attempts", module: "Attempt", description: "View test attempts" },
  { code: PERMISSIONS.RESULT_VIEW, name: "View Test Results", module: "Result", description: "View test results" },
  { code: PERMISSIONS.PERFORMANCE_VIEW, name: "View Performance Analytics", module: "Performance", description: "View performance analytics" },

  // Audit Logs
  { code: PERMISSIONS.AUDIT_LOG_VIEW, name: "View Audit Logs", module: "Audit", description: "View system audit trail" },

  // Database & Maintenance
  { code: PERMISSIONS.DATABASE_MANAGE, name: "Manage Database", module: "Database", description: "View database status and maintenance dashboard" },
  { code: PERMISSIONS.DATABASE_BACKUP_CREATE, name: "Create Database Backup", module: "Database", description: "Generate full MySQL database backup archive" },
  { code: PERMISSIONS.DATABASE_BACKUP_DOWNLOAD, name: "Download Database Backup", module: "Database", description: "Securely download database backup file" },
  { code: PERMISSIONS.DATABASE_BACKUP_DELETE, name: "Delete Database Backup", module: "Database", description: "Delete database backup archive file" },
  { code: PERMISSIONS.DATABASE_CLEAN, name: "Clean Database Data", module: "Database", description: "Perform controlled reset of application/test data" },
  { code: PERMISSIONS.DATABASE_SEED, name: "Seed Fresh Data", module: "Database", description: "Execute authoritative fresh data seeding" },

  // Candidate Self Operations
  { code: PERMISSIONS.CANDIDATE_SELF_ATTEMPT, name: "Attempt Mock Test", module: "Self", description: "Start and submit mock tests" },
  { code: PERMISSIONS.CANDIDATE_SELF_VIEW, name: "View Self Results", module: "Self", description: "View own attempt results and analytics" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  SUPER_ADMIN: [
    PERMISSIONS.EXAM_CATEGORY_VIEW,
    PERMISSIONS.EXAM_CATEGORY_CREATE,
    PERMISSIONS.EXAM_CATEGORY_UPDATE,
    PERMISSIONS.EXAM_CATEGORY_DELETE,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.EXAM_CREATE,
    PERMISSIONS.EXAM_UPDATE,
    PERMISSIONS.EXAM_DELETE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_PROCESS,
    PERMISSIONS.BLUEPRINT_VIEW,
    PERMISSIONS.BLUEPRINT_UPDATE,
    PERMISSIONS.BLUEPRINT_VERIFY,
    PERMISSIONS.BLUEPRINT_LOCK,
    PERMISSIONS.BLUEPRINT_ACTIVATE,
    PERMISSIONS.SYLLABUS_VIEW,
    PERMISSIONS.SYLLABUS_CREATE,
    PERMISSIONS.SYLLABUS_UPDATE,
    PERMISSIONS.SYLLABUS_VERIFY,
    PERMISSIONS.SYLLABUS_DELETE,
    PERMISSIONS.QUESTION_VIEW,
    PERMISSIONS.QUESTION_CREATE,
    PERMISSIONS.QUESTION_UPDATE,
    PERMISSIONS.QUESTION_REVIEW,
    PERMISSIONS.QUESTION_APPROVE,
    PERMISSIONS.MOCK_VIEW,
    PERMISSIONS.MOCK_CREATE,
    PERMISSIONS.MOCK_PUBLISH,
    PERMISSIONS.CANDIDATE_VIEW,
    PERMISSIONS.CANDIDATE_ATTEMPT_VIEW,
    PERMISSIONS.CANDIDATE_RESULT_VIEW,
    PERMISSIONS.CANDIDATE_PERFORMANCE_VIEW,
    PERMISSIONS.CANDIDATE_ACTIVITY_VIEW,
    PERMISSIONS.ATTEMPT_VIEW,
    PERMISSIONS.RESULT_VIEW,
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.DATABASE_MANAGE,
    PERMISSIONS.DATABASE_BACKUP_CREATE,
    PERMISSIONS.DATABASE_BACKUP_DOWNLOAD,
    PERMISSIONS.DATABASE_BACKUP_DELETE,
    PERMISSIONS.DATABASE_CLEAN,
    PERMISSIONS.DATABASE_SEED,
  ],
  ADMIN: [
    PERMISSIONS.EXAM_CATEGORY_VIEW,
    PERMISSIONS.EXAM_CATEGORY_CREATE,
    PERMISSIONS.EXAM_CATEGORY_UPDATE,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.EXAM_CREATE,
    PERMISSIONS.EXAM_UPDATE,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_PROCESS,
    PERMISSIONS.BLUEPRINT_VIEW,
    PERMISSIONS.BLUEPRINT_UPDATE,
    PERMISSIONS.BLUEPRINT_VERIFY,
    PERMISSIONS.BLUEPRINT_LOCK,
    PERMISSIONS.BLUEPRINT_ACTIVATE,
    PERMISSIONS.SYLLABUS_VIEW,
    PERMISSIONS.SYLLABUS_CREATE,
    PERMISSIONS.SYLLABUS_UPDATE,
    PERMISSIONS.SYLLABUS_VERIFY,
    PERMISSIONS.QUESTION_VIEW,
    PERMISSIONS.QUESTION_CREATE,
    PERMISSIONS.QUESTION_UPDATE,
    PERMISSIONS.QUESTION_REVIEW,
    PERMISSIONS.QUESTION_APPROVE,
    PERMISSIONS.MOCK_VIEW,
    PERMISSIONS.MOCK_CREATE,
    PERMISSIONS.MOCK_PUBLISH,
    PERMISSIONS.CANDIDATE_VIEW,
    PERMISSIONS.CANDIDATE_ATTEMPT_VIEW,
    PERMISSIONS.CANDIDATE_RESULT_VIEW,
    PERMISSIONS.CANDIDATE_PERFORMANCE_VIEW,
    PERMISSIONS.ATTEMPT_VIEW,
    PERMISSIONS.RESULT_VIEW,
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.DATABASE_MANAGE,
    PERMISSIONS.DATABASE_BACKUP_CREATE,
    PERMISSIONS.DATABASE_BACKUP_DOWNLOAD,
    PERMISSIONS.DATABASE_BACKUP_DELETE,
    PERMISSIONS.DATABASE_CLEAN,
    PERMISSIONS.DATABASE_SEED,
  ],
  QUESTION_REVIEWER: [
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.BLUEPRINT_VIEW,
    PERMISSIONS.SYLLABUS_VIEW,
    PERMISSIONS.QUESTION_VIEW,
    PERMISSIONS.QUESTION_REVIEW,
  ],
  CANDIDATE: [
    PERMISSIONS.CANDIDATE_SELF_ATTEMPT,
    PERMISSIONS.CANDIDATE_SELF_VIEW,
  ],
};
