import { NextRequest } from "next/server";
import { CandidateAdminService } from "@/services/candidate/candidate-admin.service";
import { RbacService } from "@/services/rbac/rbac.service";
import { PERMISSIONS } from "@/lib/constants";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    RbacService.requirePermission(session, PERMISSIONS.CANDIDATE_VIEW);

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "15", 10);

    const result = await CandidateAdminService.getCandidates({ search, page, pageSize });
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
