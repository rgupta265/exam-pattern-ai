import { NextRequest } from "next/server";
import { AttemptService } from "@/services/attempt/attempt.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { attemptId } = await params;
    const body = await req.json().catch(() => ({}));
    const isAutoSubmit = Boolean(body.isAutoSubmit);

    const result = await AttemptService.submitAttempt(attemptId, session.id, isAutoSubmit);
    return successResponse({ resultId: result.id, result });
  } catch (error) {
    return errorResponse(error);
  }
}
