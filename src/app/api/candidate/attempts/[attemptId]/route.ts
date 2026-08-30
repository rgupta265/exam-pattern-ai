import { NextRequest } from "next/server";
import { AttemptService } from "@/services/attempt/attempt.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { attemptId } = await params;
    const result = await AttemptService.getAttemptForExam(attemptId, session.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
