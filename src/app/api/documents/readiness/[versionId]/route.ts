import { NextRequest } from "next/server";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const { versionId } = await params;
    const report = await DocumentReadinessService.checkDocumentReadiness(versionId);

    return successResponse(report);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
