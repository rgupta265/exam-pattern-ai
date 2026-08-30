import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { CandidateProfileService } from "@/services/candidate/candidate-profile.service";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError("Please sign in to delete education records");

    const resolvedParams = await params;
    const profile = await CandidateProfileService.deleteEducation(session.id, resolvedParams.id);
    return successResponse(profile, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
