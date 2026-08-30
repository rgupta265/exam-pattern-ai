import { prisma } from "@/lib/prisma";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ExamFilterParams, ExamInput } from "@/modules/exam/schemas/exam.schema";
import { Prisma } from "@prisma/client";

export class ExamService {
  /**
   * Search and filter exams with server-side pagination
   */
  public static async getExams(params: ExamFilterParams) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ExamWhereInput = {
      deletedAt: null,
    };

    if (params.isCandidateFacing) {
      where.isActive = true;
      where.versions = {
        some: {
          deletedAt: null,
          status: { in: ["VERIFIED", "ACTIVE"] },
        },
      };
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.authority) {
      where.authority = { contains: params.authority };
    }

    if (params.postName) {
      where.postName = { contains: params.postName };
    }

    if (params.search) {
      const searchTerms = params.search.trim();
      where.OR = [
        { name: { contains: searchTerms } },
        { code: { contains: searchTerms } },
        { authority: { contains: searchTerms } },
        { postName: { contains: searchTerms } },
      ];
    }

    if (params.year) {
      where.versions = {
        some: {
          year: params.year,
          deletedAt: null,
          ...(params.isCandidateFacing ? { status: { in: ["VERIFIED", "ACTIVE"] } } : {}),
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          versions: {
            where: {
              deletedAt: null,
              ...(params.isCandidateFacing ? { status: { in: ["VERIFIED", "ACTIVE"] } } : {}),
            },
            orderBy: { year: "desc" },
            include: {
              blueprints: {
                where: { status: { in: ["LOCKED", "ACTIVE", "VERIFIED"] } },
                take: 1,
              },
              syllabi: {
                where: { isVerified: true },
                include: {
                  sections: {
                    include: { topics: true },
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  public static async getExamById(id: string, isCandidateFacing = false) {
    const exam = await prisma.exam.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(isCandidateFacing ? { isActive: true } : {}),
      },
      include: {
        category: true,
        versions: {
          where: {
            deletedAt: null,
            ...(isCandidateFacing ? { status: { in: ["VERIFIED", "ACTIVE"] } } : {}),
          },
          orderBy: { year: "desc" },
          include: {
            documents: {
              include: { file: true },
            },
            blueprints: {
              include: {
                sections: { orderBy: { sectionOrder: "asc" } },
                rules: true,
              },
              orderBy: { versionNumber: "desc" },
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
        },
      },
    });

    if (!exam) {
      throw new NotFoundError("Exam");
    }

    return exam;
  }

  public static async getExamBySlug(slug: string, isCandidateFacing = false) {
    const exam = await prisma.exam.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(isCandidateFacing ? { isActive: true } : {}),
      },
      include: {
        category: true,
        versions: {
          where: {
            deletedAt: null,
            ...(isCandidateFacing ? { status: { in: ["VERIFIED", "ACTIVE"] } } : {}),
          },
          orderBy: { year: "desc" },
          include: {
            blueprints: {
              include: { sections: { orderBy: { sectionOrder: "asc" } } },
              orderBy: { versionNumber: "desc" },
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
        },
      },
    });

    if (!exam) {
      throw new NotFoundError("Exam");
    }

    return exam;
  }

  public static async createExam(
    input: ExamInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_CREATE);

    const categoryExists = await prisma.examCategory.findFirst({
      where: { id: input.categoryId, deletedAt: null },
    });
    if (!categoryExists) {
      throw new NotFoundError("Exam Category");
    }

    const duplicate = await prisma.exam.findFirst({
      where: {
        OR: [{ slug: input.slug }, { code: input.code }],
        deletedAt: null,
      },
    });
    if (duplicate) {
      throw new ConflictError("An exam with this slug or code already exists");
    }

    const exam = await prisma.exam.create({
      data: {
        categoryId: input.categoryId,
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        code: input.code.trim().toUpperCase(),
        authority: input.authority.trim(),
        postName: input.postName.trim(),
        description: input.description?.trim() || null,
        isFeatured: input.isFeatured ?? false,
        isActive: input.isActive ?? true,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_CREATE",
      resourceType: "Exam",
      resourceId: exam.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { created: input },
    });

    return exam;
  }

  public static async updateExam(
    id: string,
    input: Partial<ExamInput>,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_UPDATE);

    const existing = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError("Exam");
    }

    if (input.slug || input.code) {
      const duplicate = await prisma.exam.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          OR: [
            ...(input.slug ? [{ slug: input.slug }] : []),
            ...(input.code ? [{ code: input.code }] : []),
          ],
        },
      });
      if (duplicate) {
        throw new ConflictError("Another exam with this slug or code already exists");
      }
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        categoryId: input.categoryId || existing.categoryId,
        name: input.name !== undefined ? input.name.trim() : existing.name,
        slug: input.slug !== undefined ? input.slug.trim().toLowerCase() : existing.slug,
        code: input.code !== undefined ? input.code.trim().toUpperCase() : existing.code,
        authority: input.authority !== undefined ? input.authority.trim() : existing.authority,
        postName: input.postName !== undefined ? input.postName.trim() : existing.postName,
        description: input.description !== undefined ? input.description?.trim() || null : existing.description,
        isFeatured: input.isFeatured !== undefined ? input.isFeatured : existing.isFeatured,
        isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_UPDATE",
      resourceType: "Exam",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { previous: existing, updated: input },
    });

    return updated;
  }

  public static async deleteExam(
    id: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_DELETE);

    const existing = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError("Exam");
    }

    // Soft delete exam and cascade soft-delete to active versions
    await prisma.$transaction([
      prisma.exam.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      }),
      prisma.examVersion.updateMany({
        where: { examId: id, deletedAt: null },
        data: { deletedAt: new Date(), isActive: false },
      }),
    ]);

    await AuditService.log({
      userId: user.id,
      action: "EXAM_DELETE",
      resourceType: "Exam",
      resourceId: id,
      ipAddress: ip,
      userAgent,
    });

    return true;
  }
}
