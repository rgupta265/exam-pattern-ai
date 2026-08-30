import { NextRequest } from "next/server";
import { DocumentService } from "@/services/document/document.service";
import { documentTypeEnum } from "@/modules/document/schemas/document.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { BadRequestError, UnauthorizedError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const examVersionId = formData.get("examVersionId") as string | null;
    const documentTypeRaw = formData.get("documentType") as string | null;
    const title = formData.get("title") as string | null;

    if (!file || !examVersionId || !documentTypeRaw || !title) {
      throw new BadRequestError("Missing required fields (file, examVersionId, documentType, title)");
    }

    const documentType = documentTypeEnum.parse(documentTypeRaw);

    const buffer = Buffer.from(await file.arrayBuffer());
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await DocumentService.uploadDocument({
      examVersionId,
      fileBuffer: buffer,
      originalFileName: file.name,
      mimeType: file.type || "application/pdf",
      documentType,
      title,
      user: session,
      ip,
      userAgent,
    });

    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
