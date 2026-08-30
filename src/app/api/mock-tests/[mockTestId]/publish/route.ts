import { NextRequest } from "next/server";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { publishMockSchema } from "@/modules/mock/schemas/mock.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mockTestId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { mockTestId } = await params;
    const body = await req.json();
    const validated = publishMockSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const updated = await MockEngineService.publishMock(
      mockTestId,
      validated.status,
      session,
      ip,
      userAgent
    );

    return successResponse({ mockTest: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
