import { NextRequest } from "next/server";
import { geminiPerformanceService } from "@/services/ai/gemini-performance.service";
import { ResultService } from "@/services/result/result.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { resultId } = await params;
    // Verify ownership
    await ResultService.getResultById(resultId, session.id);

    const report = await geminiPerformanceService.generateDiagnosticReport(resultId);
    return successResponse({ report });
  } catch (error) {
    return errorResponse(error);
  }
}
