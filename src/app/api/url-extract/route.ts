import { NextRequest } from "next/server";
import { UrlContentExtractorService } from "@/services/ai/url-content-extractor.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError, ValidationError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const body = await request.json();
    if (!body.url || typeof body.url !== "string") {
      return errorResponse(new ValidationError("Valid URL is required."));
    }

    const extracted = await UrlContentExtractorService.extractFromUrl(body.url.trim());

    return successResponse({
      url: extracted.url,
      hostname: extracted.hostname,
      title: extracted.title,
      wordCount: extracted.wordCount,
      preview: extracted.preview,
      contentHash: extracted.contentHash,
      fetchedAt: extracted.fetchedAt,
    });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
