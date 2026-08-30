import { NextRequest } from "next/server";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError, ValidationError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const resources = await CandidatePracticeService.getCandidateResources(user.id);
    return successResponse(resources);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const contentType = request.headers.get("content-type") || "";

    // 1. Multipart Form Data (Uploaded Document: PDF, DOCX, Image)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return errorResponse(new ValidationError("File is required."));
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await CandidatePracticeService.createResourceFromFile({
        candidateId: user.id,
        fileBuffer: buffer,
        fileName: file.name,
        mimeType: file.type,
      });

      return successResponse(result, 201);
    }

    // 2. JSON Body (Text or URL)
    const body = await request.json();

    if (body.url) {
      const resource = await CandidatePracticeService.createResourceFromUrl({
        candidateId: user.id,
        url: body.url.trim(),
      });
      return successResponse({ resource }, 201);
    }

    if (body.text) {
      const resource = await CandidatePracticeService.createResourceFromText({
        candidateId: user.id,
        title: body.title,
        text: body.text,
      });
      return successResponse({ resource }, 201);
    }

    return errorResponse(new ValidationError("Please provide a file, text, or url."));
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
