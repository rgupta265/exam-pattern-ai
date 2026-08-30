import { NextRequest } from "next/server";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const { resultId } = await params;
    const resultData = await CandidatePracticeService.getPracticeResult(resultId, user.id);

    return successResponse(resultData);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
