import { NextRequest } from "next/server";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mockTestId: string }> }
) {
  try {
    const { mockTestId } = await params;
    const mockTest = await MockEngineService.getMockTestById(mockTestId, true);
    return successResponse({ mockTest });
  } catch (error) {
    return errorResponse(error);
  }
}
