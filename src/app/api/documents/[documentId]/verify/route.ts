import { NextRequest } from "next/server";
import { DocumentReadinessService } from "@/services/document/document-readiness.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const { documentId } = await params;
    const body = await request.json().catch(() => ({}));
    const ip = request.headers.get("x-forwarded-for") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const document = await DocumentReadinessService.verifyDocument(
      documentId,
      user,
      body.notes,
      ip,
      userAgent
    );

    return successResponse(document);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
