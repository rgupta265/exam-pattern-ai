import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { RbacService } from "@/services/rbac/rbac.service";
import { DatabaseManagementService } from "@/services/database/database-management.service";
import { successResponse, errorResponse } from "@/lib/response";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    RbacService.requirePermission(session, PERMISSIONS.DATABASE_MANAGE);

    const backups = await DatabaseManagementService.listBackups();
    return successResponse(backups);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession();
    RbacService.requirePermission(session, PERMISSIONS.DATABASE_BACKUP_CREATE);

    const backup = await DatabaseManagementService.createBackup(session!.id);
    return successResponse(backup, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
