import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getCategories, POST as createCategory } from "@/app/api/exam-categories/route";
import { GET as getExams, POST as createExam } from "@/app/api/exams/route";
import { POST as verifyBlueprint } from "@/app/api/blueprints/[blueprintId]/verify/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_ROLES, PERMISSIONS } from "@/lib/constants";

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue("hashed"),
  verifyPassword: vi.fn().mockResolvedValue(true),
  signJwtToken: vi.fn().mockResolvedValue("mock-jwt-token"),
  verifyJwtToken: vi.fn().mockResolvedValue({ userId: "admin-1" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    examCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    exam: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    examBlueprint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("Phase 2 API Integration Tests", () => {
  const mockAdmin = {
    id: "admin-1",
    email: "admin@exampattern.ai",
    fullName: "Super Admin",
    roles: [USER_ROLES.SUPER_ADMIN],
    permissions: Object.values(PERMISSIONS),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/exam-categories should return list of categories", async () => {
    vi.mocked(prisma.examCategory.findMany).mockResolvedValueOnce([
      {
        id: "cat-1",
        name: "Government Jobs",
        slug: "government-jobs",
        description: null,
        icon: "🏛️",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        _count: { exams: 1 },
      } as unknown as { id: string; name: string; slug: string; description: null; icon: string; createdAt: Date; updatedAt: Date; deletedAt: null; _count: { exams: number } },
    ]);

    const res = await getCategories();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.categories).toHaveLength(1);
    expect(body.data.categories[0].name).toBe("Government Jobs");
  });

  it("POST /api/exam-categories should reject unauthorized requests", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/exam-categories", {
      method: "POST",
      body: JSON.stringify({ name: "Medical", slug: "medical" }),
    });

    const res = await createCategory(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("GET /api/exams should return paginated list of exams", async () => {
    vi.mocked(prisma.exam.findMany).mockResolvedValueOnce([
      {
        id: "exam-1",
        categoryId: "cat-1",
        name: "UP Health Officer",
        slug: "up-health-officer",
        code: "UP-CHO",
        authority: "UP Board",
        postName: "CHO",
        description: null,
        isFeatured: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        category: { id: "cat-1", name: "Government Jobs", slug: "government-jobs", icon: "🏛️" },
        versions: [],
      } as unknown as { id: string; categoryId: string; name: string; slug: string; code: string; authority: string; postName: string; description: null; isFeatured: boolean; isActive: boolean; createdAt: Date; updatedAt: Date; deletedAt: null; category: { id: string; name: string; slug: string; icon: string }; versions: [] },
    ]);
    vi.mocked(prisma.exam.count).mockResolvedValueOnce(1);

    const req = new NextRequest("http://localhost:3000/api/exams?page=1&pageSize=10");
    const res = await getExams(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });
});
