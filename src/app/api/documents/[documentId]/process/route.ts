import { NextRequest } from "next/server";
import { DocumentProcessingService } from "@/services/document/document-processing.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { documentId } = await params;
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await DocumentProcessingService.processDocument(
      documentId,
      session,
      ip,
      userAgent
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
