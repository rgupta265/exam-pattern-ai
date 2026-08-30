import { NextRequest } from "next/server";
import { AttemptService } from "@/services/attempt/attempt.service";
import { createAttemptSchema } from "@/modules/attempt/schemas/attempt.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const validated = createAttemptSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const attempt = await AttemptService.createAttempt(
      validated.mockTestId,
      session.id,
      ip,
      userAgent
    );

    return successResponse({ attempt, id: attempt.id }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
