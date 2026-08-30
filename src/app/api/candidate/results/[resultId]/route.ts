import { NextRequest } from "next/server";
import { ResultService } from "@/services/result/result.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { resultId } = await params;
    const result = await ResultService.getResultById(resultId, session.id);
    return successResponse({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
