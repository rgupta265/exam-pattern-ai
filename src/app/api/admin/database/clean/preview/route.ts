import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { RbacService } from "@/services/rbac/rbac.service";
import { DatabaseManagementService } from "@/services/database/database-management.service";
import { successResponse, errorResponse } from "@/lib/response";
import { PERMISSIONS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    RbacService.requirePermission(session, PERMISSIONS.DATABASE_CLEAN);

    const { searchParams } = new URL(req.url);
    const mode = (searchParams.get("mode") as "TEST_DATA" | "ALL_DATA") || "TEST_DATA";

    const preview = await DatabaseManagementService.getCleanPreview(mode);
    return successResponse(preview);
  } catch (error) {
    return errorResponse(error);
  }
}
