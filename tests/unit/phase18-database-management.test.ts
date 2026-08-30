import { describe, it, expect, vi, beforeEach } from "vitest";
import { DatabaseManagementService } from "@/services/database/database-management.service";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/audit.service";
import { ConflictError, BadRequestError, NotFoundError } from "@/lib/errors";
import fs from "fs";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    }),
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    databaseBackup: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    user: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    userRole: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    candidateProfile: { count: vi.fn(), deleteMany: vi.fn() },
    candidateAddress: { deleteMany: vi.fn() },
    candidateEducation: { deleteMany: vi.fn() },
    candidateExperience: { deleteMany: vi.fn() },
    candidateExamStatistic: { deleteMany: vi.fn() },
    candidateTopicStatistic: { deleteMany: vi.fn() },
    testAttempt: { count: vi.fn(), deleteMany: vi.fn() },
    testAnswer: { deleteMany: vi.fn() },
    testResult: { count: vi.fn(), deleteMany: vi.fn() },
    attemptEvent: { deleteMany: vi.fn() },
    answerEvent: { deleteMany: vi.fn() },
    practiceTest: { count: vi.fn(), deleteMany: vi.fn() },
    practiceAttempt: { deleteMany: vi.fn() },
    practiceAnswer: { deleteMany: vi.fn() },
    practiceQuestion: { deleteMany: vi.fn() },
    practiceResource: { deleteMany: vi.fn() },
    mockTest: { count: vi.fn(), deleteMany: vi.fn() },
    mockTestSection: { deleteMany: vi.fn() },
    mockTestQuestion: { deleteMany: vi.fn() },
    question: { count: vi.fn(), deleteMany: vi.fn() },
    questionOption: { deleteMany: vi.fn() },
    questionReview: { deleteMany: vi.fn() },
    examDocument: { count: vi.fn(), deleteMany: vi.fn() },
    exam: { count: vi.fn(), deleteMany: vi.fn() },
    examVersion: { deleteMany: vi.fn() },
    examCategory: { deleteMany: vi.fn() },
    examBlueprint: { deleteMany: vi.fn() },
    blueprintSection: { deleteMany: vi.fn() },
    blueprintTopicWeightage: { deleteMany: vi.fn() },
    syllabus: { deleteMany: vi.fn() },
    syllabusSection: { deleteMany: vi.fn() },
    syllabusTopic: { deleteMany: vi.fn() },
    emailVerification: { deleteMany: vi.fn() },
    passwordResetOTP: { deleteMany: vi.fn() },
  },
}));

vi.mock("@/services/audit/audit.service", () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/lib/database/config", () => ({
  DatabaseConfigService: {
    getSanitizedSummary: vi.fn().mockReturnValue({
      host: "127.0.0.1",
      port: 3306,
      database: "exampattern_test",
      username: "exam_user",
      poolSize: 10,
      ssl: false,
    }),
  },
}));

describe("Phase 18: Database Management & Maintenance Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get database status without exposing credentials or secrets", async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([
      { TABLE_NAME: "users", TABLE_ROWS: 5 },
      { TABLE_NAME: "exams", TABLE_ROWS: 2 },
    ] as any);

    const status = await DatabaseManagementService.getStatus();

    expect(status.database).toBe("exampattern_test");
    expect(status.status).toBe("connected");
    expect(status.tablesCount).toBe(2);
    expect(status.totalRows).toBe(7);
    expect((status as any).password).toBeUndefined();
    expect((status as any).url).toBeUndefined();
  });

  it("should block cleanData when confirmation phrase is invalid", async () => {
    await expect(
      DatabaseManagementService.cleanData("admin-1", "TEST_DATA", "WRONG_PHRASE")
    ).rejects.toThrow(BadRequestError);
  });

  it("should return clean data preview with preserved admin count", async () => {
    vi.mocked(prisma.role.findUnique).mockResolvedValueOnce({ id: "role-cand", code: "CANDIDATE" } as any);
    vi.mocked(prisma.userRole.count).mockResolvedValueOnce(10); // 10 candidates
    vi.mocked(prisma.testAttempt.count).mockResolvedValueOnce(50);
    vi.mocked(prisma.testResult.count).mockResolvedValueOnce(50);
    vi.mocked(prisma.practiceTest.count).mockResolvedValueOnce(20);
    vi.mocked(prisma.role.findFirst).mockResolvedValueOnce({ id: "role-admin", code: "ADMIN" } as any);
    vi.mocked(prisma.userRole.count).mockResolvedValueOnce(2); // 2 admins preserved

    const preview = await DatabaseManagementService.getCleanPreview("TEST_DATA");

    expect(preview.candidatesCount).toBe(10);
    expect(preview.attemptsCount).toBe(50);
    expect(preview.resultsCount).toBe(50);
    expect(preview.adminsPreservedCount).toBe(2);
    expect(preview.requiredConfirmationPhrase).toBe("DELETE ALL TEST DATA");
  });

  it("should return seed preview with strictly 0 candidate count", async () => {
    const seedPreview = await DatabaseManagementService.getSeedPreview();

    expect(seedPreview.candidateCount).toBe(0);
    expect(seedPreview.superAdminCount).toBe(1);
    expect(seedPreview.mockTestsCount).toBe(4);
    expect(seedPreview.questionsCount).toBe(10);
  });

  it("should reject download of non-existent backup", async () => {
    vi.mocked(prisma.databaseBackup.findUnique).mockResolvedValueOnce(null);

    await expect(
      DatabaseManagementService.getBackupForDownload("non-existent-id", "admin-1")
    ).rejects.toThrow(NotFoundError);
  });
});
