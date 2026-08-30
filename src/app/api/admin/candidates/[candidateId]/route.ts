import { NextRequest } from "next/server";
import { CandidateAdminService } from "@/services/candidate/candidate-admin.service";
import { RbacService } from "@/services/rbac/rbac.service";
import { PERMISSIONS } from "@/lib/constants";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    RbacService.requirePermission(session, PERMISSIONS.CANDIDATE_VIEW);

    const { candidateId } = await params;
    const candidate = await CandidateAdminService.getCandidateById(candidateId);
    return successResponse({ candidate });
  } catch (error) {
    return errorResponse(error);
  }
}
