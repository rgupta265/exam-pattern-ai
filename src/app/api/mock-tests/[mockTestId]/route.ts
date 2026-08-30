import { NextRequest } from "next/server";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mockTestId: string }> }
) {
  try {
    const { mockTestId } = await params;
    const url = new URL(req.url);
    const isCandidate = url.searchParams.get("candidate") === "true";

    const mockTest = await MockEngineService.getMockTestById(mockTestId, isCandidate);
    return successResponse({ mockTest });
  } catch (error) {
    return errorResponse(error);
  }
}
