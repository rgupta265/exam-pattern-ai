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

    const status = await DatabaseManagementService.getStatus();
    return successResponse(status);
  } catch (error) {
    return errorResponse(error);
  }
}
