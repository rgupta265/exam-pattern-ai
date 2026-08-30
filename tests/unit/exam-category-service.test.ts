import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExamCategoryService } from "@/services/exam/exam-category.service";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, ConflictError } from "@/lib/errors";
import { SessionUser } from "@/types/auth.types";
import { USER_ROLES, PERMISSIONS } from "@/lib/constants";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    examCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("ExamCategoryService", () => {
  const adminUser: SessionUser = {
    id: "admin-123",
    email: "admin@exampattern.ai",
    fullName: "Admin",
    roles: [USER_ROLES.ADMIN],
    permissions: [
      PERMISSIONS.EXAM_CATEGORY_VIEW,
      PERMISSIONS.EXAM_CATEGORY_CREATE,
      PERMISSIONS.EXAM_CATEGORY_UPDATE,
      PERMISSIONS.EXAM_CATEGORY_DELETE,
    ],
  };

  const candidateUser: SessionUser = {
    id: "cand-123",
    email: "candidate@exampattern.ai",
    fullName: "Candidate",
    roles: [USER_ROLES.CANDIDATE],
    permissions: [PERMISSIONS.CANDIDATE_SELF_ATTEMPT],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create category when user has EXAM_CATEGORY_CREATE permission", async () => {
    vi.mocked(prisma.examCategory.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.examCategory.create).mockResolvedValueOnce({
      id: "cat-1",
      name: "Government Jobs",
      slug: "government-jobs",
      description: "State civil exams",
      icon: "🏛️",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await ExamCategoryService.createCategory(
      {
        name: "Government Jobs",
        slug: "government-jobs",
        description: "State civil exams",
        icon: "🏛️",
      },
      adminUser
    );

    expect(result.id).toBe("cat-1");
    expect(result.name).toBe("Government Jobs");
    expect(prisma.examCategory.create).toHaveBeenCalledTimes(1);
  });

  it("should reject category creation if user lacks permission", async () => {
    await expect(
      ExamCategoryService.createCategory(
        { name: "Medical", slug: "medical" },
        candidateUser
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it("should reject creation if category name/slug already exists", async () => {
    vi.mocked(prisma.examCategory.findFirst).mockResolvedValueOnce({
      id: "cat-existing",
      name: "Government Jobs",
      slug: "government-jobs",
      description: null,
      icon: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await expect(
      ExamCategoryService.createCategory(
        { name: "Government Jobs", slug: "government-jobs" },
        adminUser
      )
    ).rejects.toThrow(ConflictError);
  });
});
