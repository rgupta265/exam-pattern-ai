import { NextRequest } from "next/server";
import { ResultService } from "@/services/result/result.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const performance = await ResultService.getCandidatePerformance(session.id);
    return successResponse({ performance });
  } catch (error) {
    return errorResponse(error);
  }
}
