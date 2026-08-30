import { NextRequest } from "next/server";
import { AttemptService } from "@/services/attempt/attempt.service";
import { attemptEventSchema } from "@/modules/attempt/schemas/attempt.schema";
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
    const validated = attemptEventSchema.parse(body);

    const event = await AttemptService.recordEvent(
      attemptId,
      validated.eventType,
      validated.eventData || null,
      session.id
    );

    return successResponse({ event });
  } catch (error) {
    return errorResponse(error);
  }
}
