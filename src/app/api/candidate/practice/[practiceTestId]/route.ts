import { NextRequest } from "next/server";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceTestId: string }> }
) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const { practiceTestId } = await params;
    const test = await CandidatePracticeService.getPracticeTestById(practiceTestId, user.id);

    return successResponse(test);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
