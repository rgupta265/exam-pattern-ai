import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { CandidateProfileService } from "@/services/candidate/candidate-profile.service";
import { addExperienceSchema } from "@/modules/candidate/schemas/profile.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError("Please sign in to add experience records");

    const body = await req.json();
    const validated = addExperienceSchema.parse(body);

    const profile = await CandidateProfileService.addExperience(session.id, validated);
    return successResponse(profile, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
