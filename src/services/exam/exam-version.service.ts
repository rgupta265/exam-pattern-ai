import { prisma } from "@/lib/prisma";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ExamVersionInput } from "@/modules/exam/schemas/exam.schema";
import { ExamVersionStatus } from "@prisma/client";

export class ExamVersionService {
  public static async getVersionsByExamId(examId: string, isCandidateFacing = false) {
    return prisma.examVersion.findMany({
      where: {
        examId,
        deletedAt: null,
        ...(isCandidateFacing ? { status: { in: ["VERIFIED", "ACTIVE"] } } : {}),
      },
      orderBy: { year: "desc" },
      include: {
        documents: {
          include: { file: true },
        },
        blueprints: {
          orderBy: { versionNumber: "desc" },
          include: { sections: { orderBy: { sectionOrder: "asc" } } },
        },
        syllabi: {
          include: {
            sections: {
              include: { topics: { orderBy: { sortOrder: "asc" } } },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  }

  public static async getVersionById(id: string) {
    const version = await prisma.examVersion.findFirst({
      where: { id, deletedAt: null },
      include: {
        exam: {
          include: { category: true },
        },
        documents: {
          include: { file: true, jobs: true },
        },
        blueprints: {
          include: {
            sections: { orderBy: { sectionOrder: "asc" } },
            rules: true,
            verifiedBy: { select: { id: true, fullName: true, email: true } },
            lockedBy: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { versionNumber: "desc" },
        },
        syllabi: {
          include: {
            sections: {
              include: { topics: { orderBy: { sortOrder: "asc" } } },
              orderBy: { sortOrder: "asc" },
            },
            verifiedBy: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundError("Exam Version");
    }

    return version;
  }

  public static async createVersion(
    input: ExamVersionInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_CREATE);

    const examExists = await prisma.exam.findFirst({
      where: { id: input.examId, deletedAt: null },
    });
    if (!examExists) {
      throw new NotFoundError("Exam");
    }

    const duplicate = await prisma.examVersion.findFirst({
      where: {
        examId: input.examId,
        year: input.year,
        versionName: input.versionName.trim(),
        deletedAt: null,
      },
    });

    if (duplicate) {
      throw new ConflictError("An exam version with this year and name already exists for this exam");
    }

    const version = await prisma.examVersion.create({
      data: {
        examId: input.examId,
        year: input.year,
        versionName: input.versionName.trim(),
        notificationNumber: input.notificationNumber?.trim() || null,
        status: (input.status as ExamVersionStatus) || "DRAFT",
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        description: input.description?.trim() || null,
        isActive: true,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_VERSION_CREATE",
      resourceType: "ExamVersion",
      resourceId: version.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { created: input },
    });

    return version;
  }

  public static async updateVersionStatus(
    id: string,
    status: ExamVersionStatus,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_UPDATE);

    const existing = await prisma.examVersion.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError("Exam Version");
    }

    const updated = await prisma.examVersion.update({
      where: { id },
      data: {
        status,
        isActive: status === "ACTIVE",
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_VERSION_STATUS_UPDATE",
      resourceType: "ExamVersion",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { previousStatus: existing.status, newStatus: status },
    });

    return updated;
  }

  public static async archiveVersion(
    id: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_DELETE);

    const existing = await prisma.examVersion.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError("Exam Version");
    }

    const updated = await prisma.examVersion.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_VERSION_ARCHIVE",
      resourceType: "ExamVersion",
      resourceId: id,
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }
}
