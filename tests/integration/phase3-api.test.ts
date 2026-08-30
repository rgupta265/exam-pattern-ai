import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getQuestions, POST as createQuestion } from "@/app/api/questions/route";
import { GET as getMockTests } from "@/app/api/mock-tests/route";
import { GET as getCandidateMockTests } from "@/app/api/candidate/mock-tests/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_ROLES, PERMISSIONS } from "@/lib/constants";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue("hashed"),
  verifyPassword: vi.fn().mockResolvedValue(true),
  signJwtToken: vi.fn().mockResolvedValue("mock-jwt-token"),
  verifyJwtToken: vi.fn().mockResolvedValue({ userId: "admin-1" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    syllabusTopic: {
      findUnique: vi.fn(),
    },
    mockTest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("Phase 3 API Integration Tests", () => {
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

  it("GET /api/questions should return paginated list of questions", async () => {
    vi.mocked(prisma.question.findMany).mockResolvedValueOnce([
      {
        id: "q-1",
        questionText: "What is community health?",
        difficulty: "MEDIUM",
        status: "APPROVED",
        marks: new Prisma.Decimal(1),
        negativeMarks: new Prisma.Decimal(0.25),
        options: [],
        topic: { name: "Community Health", section: { name: "Clinical" } },
        reviews: [],
      } as unknown as any,
    ]);
    vi.mocked(prisma.question.count).mockResolvedValueOnce(1);

    const req = new NextRequest("http://localhost:3000/api/questions?page=1&pageSize=10");
    const res = await getQuestions(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].questionText).toBe("What is community health?");
  });

  it("POST /api/questions should reject unauthorized requests", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/questions", {
      method: "POST",
      body: JSON.stringify({ questionText: "Invalid without session" }),
    });

    const res = await createQuestion(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("GET /api/candidate/mock-tests should return published mock tests for candidates", async () => {
    vi.mocked(prisma.mockTest.findMany).mockResolvedValueOnce([
      {
        id: "mock-1",
        title: "UP CHO Full Mock 1",
        type: "FULL_MOCK",
        totalQuestions: 100,
        totalMarks: new Prisma.Decimal(100),
        durationMinutes: 120,
        negativeRate: new Prisma.Decimal(0.25),
        status: "PUBLISHED",
        examVersion: { versionName: "2026 Regular", exam: { name: "UP Health Officer", authority: "UP Board" } },
        _count: { questions: 100, sections: 2 },
      } as unknown as any,
    ]);
    vi.mocked(prisma.mockTest.count).mockResolvedValueOnce(1);

    const req = new NextRequest("http://localhost:3000/api/candidate/mock-tests");
    const res = await getCandidateMockTests(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].title).toBe("UP CHO Full Mock 1");
  });
});
