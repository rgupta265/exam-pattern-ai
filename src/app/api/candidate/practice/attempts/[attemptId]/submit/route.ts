import { NextRequest } from "next/server";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const { attemptId } = await params;
    const submission = await CandidatePracticeService.submitPracticeAttempt({
      attemptId,
      candidateId: user.id,
    });

    return successResponse(submission);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
