import { NextRequest } from "next/server";
import { MockPatternValidatorService } from "@/services/mock/mock-pattern-validator.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ mockTestId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { mockTestId } = await params;
    const report = await MockPatternValidatorService.validate(mockTestId);
    return successResponse({ report });
  } catch (error) {
    return errorResponse(error);
  }
}
