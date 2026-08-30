import { prisma } from "@/lib/prisma";
import { RbacService } from "@/services/rbac/rbac.service";
import { AuditService } from "@/services/audit/audit.service";
import { BlueprintValidationService } from "./blueprint-validation.service";
import { PERMISSIONS } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { BadRequestError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { UpdateBlueprintInput } from "@/modules/blueprint/schemas/blueprint.schema";
import { Prisma } from "@prisma/client";

export class BlueprintService {
  public static async getBlueprintById(id: string) {
    const blueprint = await prisma.examBlueprint.findUnique({
      where: { id },
      include: {
        examVersion: {
          include: {
            exam: { include: { category: true } },
          },
        },
        sections: { orderBy: { sectionOrder: "asc" } },
        rules: true,
        verifiedBy: { select: { id: true, fullName: true, email: true } },
        lockedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!blueprint) {
      throw new NotFoundError("Exam Blueprint");
    }

    return blueprint;
  }

  public static async getBlueprintsByVersion(examVersionId: string) {
    return prisma.examBlueprint.findMany({
      where: { examVersionId },
      orderBy: { versionNumber: "desc" },
      include: {
        sections: { orderBy: { sectionOrder: "asc" } },
        rules: true,
        verifiedBy: { select: { id: true, fullName: true, email: true } },
        lockedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /**
   * Update blueprint draft and sections (strictly rejected if blueprint is LOCKED)
   */
  public static async updateBlueprint(
    id: string,
    input: UpdateBlueprintInput,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.BLUEPRINT_UPDATE);

    const existing = await prisma.examBlueprint.findUnique({
      where: { id },
      include: { sections: true, rules: true },
    });

    if (!existing) {
      throw new NotFoundError("Exam Blueprint");
    }

    // IMMUTABILITY RULE: Locked blueprints can NEVER be mutated
    if (existing.status === "LOCKED" || existing.status === "ACTIVE") {
      throw new ForbiddenError(
        "This blueprint is LOCKED and immutable. To make modifications, upload a corrigendum to create a new blueprint version."
      );
    }

    // Determine updated lifecycle status
    const newStatus = existing.status === "AI_ANALYZED" ? "UNDER_REVIEW" : existing.status;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Delete old sections and rules
      await tx.blueprintSection.deleteMany({ where: { blueprintId: id } });
      await tx.blueprintRule.deleteMany({ where: { blueprintId: id } });

      // 2. Update blueprint parent entity
      return tx.examBlueprint.update({
        where: { id },
        data: {
          title: input.title.trim(),
          totalQuestions: input.totalQuestions,
          totalMarks: new Prisma.Decimal(input.totalMarks),
          durationMinutes: input.durationMinutes,
          hasNegativeMarking: input.hasNegativeMarking,
          negativeMarkingRate: new Prisma.Decimal(input.negativeMarkingRate),
          instructions: input.instructions?.trim() || null,
          status: newStatus,
          sections: {
            create: input.sections.map((sec) => ({
              name: sec.name.trim(),
              sectionOrder: sec.sectionOrder,
              questionCount: sec.questionCount,
              marksPerQuestion: new Prisma.Decimal(sec.marksPerQuestion),
              totalMarks: new Prisma.Decimal(sec.totalMarks),
              negativeRate: new Prisma.Decimal(sec.negativeRate),
              instructions: sec.instructions?.trim() || null,
            })),
          },
          rules: {
            create: (input.rules || []).map((r) => ({
              ruleType: r.ruleType.trim(),
              ruleConfig: r.ruleConfig as Prisma.InputJsonValue,
              description: r.description?.trim() || null,
            })),
          },
        },
        include: {
          sections: { orderBy: { sectionOrder: "asc" } },
          rules: true,
        },
      });
    });

    await AuditService.log({
      userId: user.id,
      action: "BLUEPRINT_UPDATE",
      resourceType: "ExamBlueprint",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { previous: existing, updated: input },
    });

    return updated;
  }

  /**
   * Verify blueprint against mathematical constraints and mark VERIFIED
   */
  public static async verifyBlueprint(
    id: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.BLUEPRINT_VERIFY);

    const blueprint = await prisma.examBlueprint.findUnique({
      where: { id },
      include: { sections: true, rules: true },
    });

    if (!blueprint) {
      throw new NotFoundError("Exam Blueprint");
    }

    if (blueprint.status === "LOCKED" || blueprint.status === "ACTIVE") {
      throw new BadRequestError("Blueprint is already locked.");
    }

    // Run mathematical validation engine
    const report = BlueprintValidationService.validate({
      totalQuestions: blueprint.totalQuestions,
      totalMarks: Number(blueprint.totalMarks),
      durationMinutes: blueprint.durationMinutes,
      hasNegativeMarking: blueprint.hasNegativeMarking,
      negativeMarkingRate: Number(blueprint.negativeMarkingRate),
      sections: blueprint.sections.map((s) => ({
        name: s.name,
        sectionOrder: s.sectionOrder,
        questionCount: s.questionCount,
        marksPerQuestion: Number(s.marksPerQuestion),
        totalMarks: Number(s.totalMarks),
        negativeRate: Number(s.negativeRate),
      })),
    });

    if (!report.isValid) {
      throw new ValidationError("Blueprint failed validation check rules", report.errors);
    }

    const verified = await prisma.examBlueprint.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedById: user.id,
        verifiedAt: new Date(),
      },
      include: {
        sections: { orderBy: { sectionOrder: "asc" } },
        verifiedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "BLUEPRINT_VERIFY",
      resourceType: "ExamBlueprint",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { status: "VERIFIED", verifiedAt: verified.verifiedAt },
    });

    return { blueprint: verified, report };
  }

  /**
   * Lock blueprint into immutable state (Authority Rule)
   */
  public static async lockBlueprint(
    id: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.BLUEPRINT_LOCK);

    const blueprint = await prisma.examBlueprint.findUnique({
      where: { id },
      include: { sections: true },
    });

    if (!blueprint) {
      throw new NotFoundError("Exam Blueprint");
    }

    if (blueprint.status !== "VERIFIED") {
      throw new BadRequestError("Blueprint must be VERIFIED before it can be LOCKED.");
    }

    const locked = await prisma.$transaction(async (tx) => {
      const bp = await tx.examBlueprint.update({
        where: { id },
        data: {
          status: "LOCKED",
          lockedById: user.id,
          lockedAt: new Date(),
        },
        include: {
          sections: { orderBy: { sectionOrder: "asc" } },
          verifiedBy: { select: { id: true, fullName: true, email: true } },
          lockedBy: { select: { id: true, fullName: true, email: true } },
        },
      });

      // Update parent exam version status
      await tx.examVersion.update({
        where: { id: blueprint.examVersionId },
        data: { status: "VERIFIED" },
      });

      return bp;
    });

    await AuditService.log({
      userId: user.id,
      action: "BLUEPRINT_LOCK",
      resourceType: "ExamBlueprint",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { status: "LOCKED", lockedAt: locked.lockedAt },
    });

    return locked;
  }

  /**
   * Activate blueprint for candidate-facing mock tests
   */
  public static async activateBlueprint(
    id: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.BLUEPRINT_ACTIVATE);

    const blueprint = await prisma.examBlueprint.findUnique({
      where: { id },
      include: { examVersion: true },
    });

    if (!blueprint) {
      throw new NotFoundError("Exam Blueprint");
    }

    if (blueprint.status !== "LOCKED" && blueprint.status !== "ACTIVE") {
      throw new BadRequestError("Only a LOCKED blueprint can be ACTIVATED.");
    }

    const activated = await prisma.$transaction(async (tx) => {
      const bp = await tx.examBlueprint.update({
        where: { id },
        data: { status: "ACTIVE" },
      });

      // Activate version and exam for candidate discovery
      await tx.examVersion.update({
        where: { id: blueprint.examVersionId },
        data: { status: "ACTIVE", isActive: true },
      });

      await tx.exam.update({
        where: { id: blueprint.examVersion.examId },
        data: { isActive: true },
      });

      return bp;
    });

    await AuditService.log({
      userId: user.id,
      action: "BLUEPRINT_ACTIVATE",
      resourceType: "ExamBlueprint",
      resourceId: id,
      ipAddress: ip,
      userAgent,
      changesDiff: { status: "ACTIVE" },
    });

    return activated;
  }

  /**
   * Create a new Corrigendum / Amended Blueprint version without mutating historical locked blueprint
   */
  public static async createCorrigendumBlueprint(
    lockedBlueprintId: string,
    newTitle: string,
    user: SessionUser,
    ip?: string,
    userAgent?: string
  ) {
    RbacService.requirePermission(user, PERMISSIONS.BLUEPRINT_UPDATE);

    const source = await prisma.examBlueprint.findUnique({
      where: { id: lockedBlueprintId },
      include: { sections: true, rules: true },
    });

    if (!source) {
      throw new NotFoundError("Source Exam Blueprint");
    }

    const nextVersionNumber = source.versionNumber + 1;

    const newDraft = await prisma.examBlueprint.create({
      data: {
        examVersionId: source.examVersionId,
        versionNumber: nextVersionNumber,
        title: newTitle.trim() || `Corrigendum Blueprint V${nextVersionNumber}`,
        totalQuestions: source.totalQuestions,
        totalMarks: source.totalMarks,
        durationMinutes: source.durationMinutes,
        hasNegativeMarking: source.hasNegativeMarking,
        negativeMarkingRate: source.negativeMarkingRate,
        status: "DRAFT",
        instructions: source.instructions,
        sections: {
          create: source.sections.map((s) => ({
            name: s.name,
            sectionOrder: s.sectionOrder,
            questionCount: s.questionCount,
            marksPerQuestion: s.marksPerQuestion,
            totalMarks: s.totalMarks,
            negativeRate: s.negativeRate,
            instructions: s.instructions,
          })),
        },
        rules: {
          create: source.rules.map((r) => ({
            ruleType: r.ruleType,
            ruleConfig: r.ruleConfig as Prisma.InputJsonValue,
            description: r.description,
          })),
        },
      },
      include: {
        sections: { orderBy: { sectionOrder: "asc" } },
        rules: true,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: "BLUEPRINT_CORRIGENDUM_CREATE",
      resourceType: "ExamBlueprint",
      resourceId: newDraft.id,
      ipAddress: ip,
      userAgent,
      changesDiff: { sourceId: source.id, newVersionNumber: nextVersionNumber },
    });

    return newDraft;
  }
}
