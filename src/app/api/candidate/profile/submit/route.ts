import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { CandidateProfileService } from "@/services/candidate/candidate-profile.service";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError("Please sign in to submit your profile");

    const profile = await CandidateProfileService.submitProfile(session.id);
    return successResponse(profile, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
