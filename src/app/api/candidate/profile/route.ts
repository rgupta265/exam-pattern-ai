import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { CandidateProfileService } from "@/services/candidate/candidate-profile.service";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError("Please sign in to access your profile");

    const profile = await CandidateProfileService.getProfile(session.id);
    return successResponse(profile, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
