import { prisma } from "@/lib/prisma";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { NotFoundError } from "@/lib/errors";
import {
  CreateSyllabusInput,
  SyllabusSectionInput,
  SyllabusTopicInput,
} from "@/modules/syllabus/schemas/syllabus.schema";
import { Prisma } from "@prisma/client";

export class SyllabusService {
  public static async getSyllabusByVersion(examVersionId: string, isCandidateFacing = false) {
    return prisma.syllabus.findMany({
      where: {
        examVersionId,
        ...(isCandidateFacing ? { isVerified: true } : {}),
      },
      include: {
        sections: {
          include: {
            topics: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { sortOrder: "asc" },
        },
        verifiedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  public static async getSyllabusById(id: string) {
    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      include: {
        examVersion: {
          include: {
            exam: { include: { category: true } },
          },
        },
        sections: {
          include: {
            topics: { orderBy: { sortOrder: "asc" } },
          },
          orderBy: { sortOrder: "asc" },
        },
        verifiedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!syllabus) {
      throw new NotFoundError("Syllabus");
    }

    return syllabus;
  }

  public static async createSyllabus(
    input: CreateSyllabusInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.SYLLABUS_CREATE);

    const versionExists = await prisma.examVersion.findFirst({
      where: { id: input.examVersionId, deletedAt: null },
    });
    if (!versionExists) {
      throw new NotFoundError("Exam Version");
    }

    const syllabus = await prisma.syllabus.create({
      data: {
        examVersionId: input.examVersionId,
        title: input.title.trim(),
        isVerified: false,
        sections: {
          create: input.sections.map((sec) => ({
            name: sec.name.trim(),
            code: sec.code?.trim() || null,
            description: sec.description?.trim() || null,
            sortOrder: sec.sortOrder,
            topics: {
              create: sec.topics.map((t) => ({
                name: t.name.trim(),
                code: t.code?.trim() || null,
                description: t.description?.trim() || null,
                weightagePercentage: t.weightagePercentage !== null && t.weightagePercentage !== undefined
                  ? new Prisma.Decimal(t.weightagePercentage)
                  : null,
                sortOrder: t.sortOrder,
              })),
            },
          })),
        },
      },
      include: {
        sections: {
          include: { topics: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "SYLLABUS_CREATE",
      resourceType: "Syllabus",
      resourceId: syllabus.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { created: input },
    });

    return syllabus;
  }

  public static async addSection(
    syllabusId: string,
    input: SyllabusSectionInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.SYLLABUS_CREATE);

    const syllabus = await prisma.syllabus.findUnique({ where: { id: syllabusId } });
    if (!syllabus) throw new NotFoundError("Syllabus");

    const section = await prisma.syllabusSection.create({
      data: {
        syllabusId,
        name: input.name.trim(),
        code: input.code?.trim() || null,
        description: input.description?.trim() || null,
        sortOrder: input.sortOrder,
        topics: {
          create: (input.topics || []).map((t) => ({
            name: t.name.trim(),
            code: t.code?.trim() || null,
            description: t.description?.trim() || null,
            weightagePercentage: t.weightagePercentage !== null && t.weightagePercentage !== undefined
              ? new Prisma.Decimal(t.weightagePercentage)
              : null,
            sortOrder: t.sortOrder,
          })),
        },
      },
      include: { topics: true },
    });

    await AuditService.log({
      userId: user.id,
      action: "SYLLABUS_SECTION_CREATE",
      resourceType: "SyllabusSection",
      resourceId: section.id,
      ipAddress: ip,
      userAgent,
    });

    return section;
  }

  public static async addTopic(
    sectionId: string,
    input: SyllabusTopicInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.SYLLABUS_CREATE);

    const section = await prisma.syllabusSection.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundError("Syllabus Section");

    const topic = await prisma.syllabusTopic.create({
      data: {
        sectionId,
        name: input.name.trim(),
        code: input.code?.trim() || null,
        description: input.description?.trim() || null,
        weightagePercentage: input.weightagePercentage !== null && input.weightagePercentage !== undefined
          ? new Prisma.Decimal(input.weightagePercentage)
          : null,
        sortOrder: input.sortOrder,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "SYLLABUS_TOPIC_CREATE",
      resourceType: "SyllabusTopic",
      resourceId: topic.id,
      ipAddress: ip,
      userAgent,
    });

    return topic;
  }

  public static async verifySyllabus(
    syllabusId: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.SYLLABUS_VERIFY);

    const syllabus = await prisma.syllabus.findUnique({ where: { id: syllabusId } });
    if (!syllabus) throw new NotFoundError("Syllabus");

    const verified = await prisma.syllabus.update({
      where: { id: syllabusId },
      data: {
        isVerified: true,
        verifiedById: user.id,
        verifiedAt: new Date(),
      },
      include: {
        sections: { include: { topics: true } },
        verifiedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "SYLLABUS_VERIFY",
      resourceType: "Syllabus",
      resourceId: syllabusId,
      ipAddress: ip,
      userAgent,
      changesDiff: { isVerified: true, verifiedAt: verified.verifiedAt },
    });

    return verified;
  }
}
