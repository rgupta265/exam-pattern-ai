import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { CandidateProfileService } from "@/services/candidate/candidate-profile.service";
import { updateAddressSchema } from "@/modules/candidate/schemas/profile.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError("Please sign in to update your address");

    const body = await req.json();
    const validated = updateAddressSchema.parse(body);

    const profile = await CandidateProfileService.updateAddress(session.id, validated);
    return successResponse(profile, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
