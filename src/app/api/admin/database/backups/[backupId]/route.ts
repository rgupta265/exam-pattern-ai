import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { RbacService } from "@/services/rbac/rbac.service";
import { DatabaseManagementService } from "@/services/database/database-management.service";
import { successResponse, errorResponse } from "@/lib/response";
import { PERMISSIONS } from "@/lib/constants";

interface RouteContext {
  params: Promise<{ backupId: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession();
    RbacService.requirePermission(session, PERMISSIONS.DATABASE_BACKUP_DELETE);

    const { backupId } = await context.params;
    const result = await DatabaseManagementService.deleteBackup(backupId, session!.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
