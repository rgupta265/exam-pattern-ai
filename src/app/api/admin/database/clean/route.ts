import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { RbacService } from "@/services/rbac/rbac.service";
import { DatabaseManagementService } from "@/services/database/database-management.service";
import { successResponse, errorResponse } from "@/lib/response";
import { BadRequestError } from "@/lib/errors";
import { PERMISSIONS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    RbacService.requirePermission(session, PERMISSIONS.DATABASE_CLEAN);

    const body = await req.json().catch(() => ({}));
    const { mode, confirmationPhrase } = body;

    if (!mode || !["TEST_DATA", "ALL_DATA"].includes(mode)) {
      throw new BadRequestError("Valid mode ('TEST_DATA' or 'ALL_DATA') is required.");
    }

    if (!confirmationPhrase) {
      throw new BadRequestError("Explicit confirmation phrase is required.");
    }

    const result = await DatabaseManagementService.cleanData(session!.id, mode, confirmationPhrase);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
