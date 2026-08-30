import { NextRequest } from "next/server";
import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const body = await request.json();

    const practiceTest = await CandidatePracticeService.generatePracticeTest({
      candidateId: user.id,
      title: body.title,
      resourceId: body.resourceId,
      rawText: body.rawText,
      sourceUrl: body.sourceUrl,
      examVersionId: body.examVersionId,
      topicIds: body.topicIds,
      questionCount: body.questionCount,
      difficulty: body.difficulty,
      language: body.language,
      generationMode: body.generationMode,
    });

    return successResponse(practiceTest, 201);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
