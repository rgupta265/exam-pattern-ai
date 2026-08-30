import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlueprintService } from "@/services/blueprint/blueprint.service";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";
import { SessionUser } from "@/types/auth.types";
import { USER_ROLES, PERMISSIONS } from "@/lib/constants";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    examBlueprint: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    blueprintSection: {
      deleteMany: vi.fn(),
    },
    blueprintRule: {
      deleteMany: vi.fn(),
    },
    examVersion: {
      update: vi.fn(),
    },
    exam: {
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe("Blueprint Lifecycle & Immutability Rules", () => {
  const adminUser: SessionUser = {
    id: "admin-123",
    email: "admin@exampattern.ai",
    fullName: "Admin",
    roles: [USER_ROLES.ADMIN],
    permissions: [
      PERMISSIONS.BLUEPRINT_VIEW,
      PERMISSIONS.BLUEPRINT_UPDATE,
      PERMISSIONS.BLUEPRINT_VERIFY,
      PERMISSIONS.BLUEPRINT_LOCK,
      PERMISSIONS.BLUEPRINT_ACTIVATE,
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent modifications if blueprint is in LOCKED state (Immutability Rule)", async () => {
    vi.mocked(prisma.examBlueprint.findUnique).mockResolvedValueOnce({
      id: "bp-locked",
      examVersionId: "ver-1",
      versionNumber: 1,
      title: "Locked Blueprint",
      totalQuestions: 100,
      totalMarks: new Prisma.Decimal(100),
      durationMinutes: 120,
      negativeMarkingRate: new Prisma.Decimal(0.25),
      hasNegativeMarking: true,
      status: "LOCKED",
      verifiedById: "admin-123",
      verifiedAt: new Date(),
      lockedById: "admin-123",
      lockedAt: new Date(),
      instructions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: [],
      rules: [],
    } as unknown as any);

    await expect(
      BlueprintService.updateBlueprint(
        "bp-locked",
        {
          title: "Attempted Modification",
          totalQuestions: 100,
          totalMarks: 100,
          durationMinutes: 120,
          hasNegativeMarking: true,
          negativeMarkingRate: 0.25,
          sections: [
            {
              name: "Section 1",
              sectionOrder: 1,
              questionCount: 100,
              marksPerQuestion: 1,
              totalMarks: 100,
              negativeRate: 0.25,
            },
          ],
          rules: [],
        },
        adminUser
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it("should verify blueprint if section math is valid and transition to VERIFIED", async () => {
    vi.mocked(prisma.examBlueprint.findUnique).mockResolvedValueOnce({
      id: "bp-1",
      examVersionId: "ver-1",
      versionNumber: 1,
      title: "Draft Blueprint",
      totalQuestions: 100,
      totalMarks: new Prisma.Decimal(100),
      durationMinutes: 120,
      negativeMarkingRate: new Prisma.Decimal(0.25),
      hasNegativeMarking: true,
      status: "UNDER_REVIEW",
      verifiedById: null,
      verifiedAt: null,
      lockedById: null,
      lockedAt: null,
      instructions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: [
        {
          id: "sec-1",
          blueprintId: "bp-1",
          name: "Section 1",
          sectionOrder: 1,
          questionCount: 100,
          marksPerQuestion: new Prisma.Decimal(1),
          totalMarks: new Prisma.Decimal(100),
          negativeRate: new Prisma.Decimal(0.25),
          instructions: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      rules: [],
    } as unknown as any);

    vi.mocked(prisma.examBlueprint.update).mockResolvedValueOnce({
      id: "bp-1",
      status: "VERIFIED",
      verifiedAt: new Date(),
      sections: [],
      verifiedBy: { id: "admin-123", fullName: "Admin", email: "admin@exampattern.ai" },
    } as unknown as any);

    const result = await BlueprintService.verifyBlueprint("bp-1", adminUser);
    expect(result.report.isValid).toBe(true);
    expect(result.blueprint.status).toBe("VERIFIED");
  });

  it("should lock a verified blueprint and transition to LOCKED", async () => {
    vi.mocked(prisma.examBlueprint.findUnique).mockResolvedValueOnce({
      id: "bp-verified",
      examVersionId: "ver-1",
      versionNumber: 1,
      title: "Verified Blueprint",
      totalQuestions: 100,
      totalMarks: new Prisma.Decimal(100),
      durationMinutes: 120,
      negativeMarkingRate: new Prisma.Decimal(0.25),
      hasNegativeMarking: true,
      status: "VERIFIED",
      verifiedById: "admin-123",
      verifiedAt: new Date(),
      lockedById: null,
      lockedAt: null,
      instructions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: [],
    } as unknown as any);

    vi.mocked(prisma.examBlueprint.update).mockResolvedValueOnce({
      id: "bp-verified",
      status: "LOCKED",
      lockedAt: new Date(),
      sections: [],
    } as unknown as any);

    const result = await BlueprintService.lockBlueprint("bp-verified", adminUser);
    expect(result.status).toBe("LOCKED");
  });

  it("should create a new corrigendum blueprint version incrementing versionNumber", async () => {
    vi.mocked(prisma.examBlueprint.findUnique).mockResolvedValueOnce({
      id: "bp-locked-v1",
      examVersionId: "ver-1",
      versionNumber: 1,
      title: "Original Locked Blueprint",
      totalQuestions: 100,
      totalMarks: new Prisma.Decimal(100),
      durationMinutes: 120,
      negativeMarkingRate: new Prisma.Decimal(0.25),
      hasNegativeMarking: true,
      status: "LOCKED",
      instructions: null,
      sections: [
        {
          name: "Section 1",
          sectionOrder: 1,
          questionCount: 100,
          marksPerQuestion: new Prisma.Decimal(1),
          totalMarks: new Prisma.Decimal(100),
          negativeRate: new Prisma.Decimal(0.25),
          instructions: null,
        },
      ],
      rules: [],
    } as unknown as any);

    vi.mocked(prisma.examBlueprint.create).mockResolvedValueOnce({
      id: "bp-v2",
      versionNumber: 2,
      title: "Corrigendum Blueprint V2",
      status: "DRAFT",
      sections: [],
      rules: [],
    } as unknown as any);

    const result = await BlueprintService.createCorrigendumBlueprint(
      "bp-locked-v1",
      "Corrigendum Blueprint V2",
      adminUser
    );

    expect(result.versionNumber).toBe(2);
    expect(result.status).toBe("DRAFT");
  });
});
