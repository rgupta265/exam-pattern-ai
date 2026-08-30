import { NextRequest } from "next/server";
import { ActualPatternGeneratorService } from "@/services/mock/actual-pattern-generator.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError, ValidationError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const body = await request.json();
    if (!body.examVersionId) {
      return errorResponse(new ValidationError("examVersionId is required"));
    }

    const ip = request.headers.get("x-forwarded-for") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await ActualPatternGeneratorService.generateActualPatternMock({
      examVersionId: body.examVersionId,
      customTitle: body.customTitle,
      user,
      ip,
      userAgent,
    });

    return successResponse(result, 201);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
