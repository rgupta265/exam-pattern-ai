import { NextRequest } from "next/server";
import { AttemptService } from "@/services/attempt/attempt.service";
import { autosaveAnswerSchema } from "@/modules/attempt/schemas/attempt.schema";
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
    const body = await req.json();
    const validated = autosaveAnswerSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const answer = await AttemptService.saveAnswer(
      attemptId,
      validated,
      session.id,
      ip,
      userAgent
    );

    return successResponse({ answer });
  } catch (error) {
    return errorResponse(error);
  }
}
