import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { AISuggestionService } from "@/services/ai/ai-suggestion.service";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError, BadRequestError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) throw new UnauthorizedError();

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const examVersionId = searchParams.get("examVersionId") || undefined;

    if (!examId) {
      throw new BadRequestError("Query parameter 'examId' is required.");
    }

    const suggestions = await AISuggestionService.getSuggestionsForExam(examId, examVersionId);

    return successResponse({ suggestions });
  } catch (error) {
    return errorResponse(error);
  }
}
