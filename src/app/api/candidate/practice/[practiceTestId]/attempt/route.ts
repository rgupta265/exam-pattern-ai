import { NextRequest } from "next/server";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceTestId: string }> }
) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const { practiceTestId } = await params;
    const attemptData = await CandidatePracticeService.startPracticeAttempt(practiceTestId, user.id);

    return successResponse(attemptData, 201);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
