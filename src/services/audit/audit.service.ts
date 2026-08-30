import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  changesDiff?: Record<string, unknown> | null;
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          changesDiff: (params.changesDiff as Prisma.InputJsonValue) || Prisma.DbNull,
        },
      });
    } catch (error) {
      // Non-blocking fallback for audit logger to avoid breaking core transactions if DB logging fails
      console.error("[AuditService] Failed to record audit log:", error);
    }
  }

  /**
   * Fetch recent audit logs with pagination
   */
  static async getLogs(params: {
    page?: number;
    pageSize?: number;
    resourceType?: string;
    action?: string;
    userId?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.action) where.action = params.action;
    if (params.userId) where.userId = params.userId;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
