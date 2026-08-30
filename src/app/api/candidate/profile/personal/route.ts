import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { CandidateProfileService } from "@/services/candidate/candidate-profile.service";
import { updatePersonalSchema } from "@/modules/candidate/schemas/profile.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError("Please sign in to update your profile");

    const body = await req.json();
    const validated = updatePersonalSchema.parse(body);

    const profile = await CandidateProfileService.updatePersonalDetails(session.id, validated);
    return successResponse(profile, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
