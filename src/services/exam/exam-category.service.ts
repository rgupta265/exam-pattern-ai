import { prisma } from "@/lib/prisma";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ExamCategoryInput } from "@/modules/exam/schemas/exam.schema";

export class ExamCategoryService {
  public static async getAllCategories() {
    return prisma.examCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { exams: { where: { deletedAt: null } } },
        },
      },
    });
  }

  public static async getCategoryById(id: string) {
    const category = await prisma.examCategory.findFirst({
      where: { id, deletedAt: null },
      include: {
        exams: {
          where: { deletedAt: null },
          include: {
            versions: {
              where: { deletedAt: null },
              orderBy: { year: "desc" },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Exam Category");
    }

    return category;
  }

  public static async getCategoryBySlug(slug: string) {
    const category = await prisma.examCategory.findFirst({
      where: { slug, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundError("Exam Category");
    }

    return category;
  }

  public static async createCategory(
    input: ExamCategoryInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_CATEGORY_CREATE);

    const existing = await prisma.examCategory.findFirst({
      where: {
        OR: [{ name: input.name }, { slug: input.slug }],
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictError("An exam category with this name or slug already exists");
    }

    const category = await prisma.examCategory.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description?.trim() || null,
        icon: input.icon || null,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_CATEGORY_CREATE",
      resourceType: "ExamCategory",
      resourceId: category.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { created: input },
    });

    return category;
  }

  public static async updateCategory(
    id: string,
    input: Partial<ExamCategoryInput>,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_CATEGORY_UPDATE);

    const existing = await prisma.examCategory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError("Exam Category");
    }

    if (input.name || input.slug) {
      const duplicate = await prisma.examCategory.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          OR: [
            ...(input.name ? [{ name: input.name }] : []),
            ...(input.slug ? [{ slug: input.slug }] : []),
          ],
        },
      });

      if (duplicate) {
        throw new ConflictError("Another category already exists with this name or slug");
      }
    }

    const updated = await prisma.examCategory.update({
      where: { id },
      data: {
        name: input.name?.trim() || existing.name,
        slug: input.slug?.trim().toLowerCase() || existing.slug,
        description: input.description !== undefined ? input.description?.trim() || null : existing.description,
        icon: input.icon !== undefined ? input.icon : existing.icon,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_CATEGORY_UPDATE",
      resourceType: "ExamCategory",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { previous: existing, updated: input },
    });

    return updated;
  }

  public static async deleteCategory(
    id: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.EXAM_CATEGORY_DELETE);

    const existing = await prisma.examCategory.findFirst({
      where: { id, deletedAt: null },
      include: {
        exams: { where: { deletedAt: null } },
      },
    });

    if (!existing) {
      throw new NotFoundError("Exam Category");
    }

    if (existing.exams.length > 0) {
      throw new ConflictError("Cannot delete category containing active exams. Remove or reassign exams first.");
    }

    // Soft delete
    await prisma.examCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await AuditService.log({
      userId: user.id,
      action: "EXAM_CATEGORY_DELETE",
      resourceType: "ExamCategory",
      resourceId: id,
      ipAddress: ip,
      userAgent,
    });

    return true;
  }
}
