import { NextRequest } from "next/server";
import { QuestionService } from "@/services/question/question.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { BadRequestError, UnauthorizedError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const { examVersionId, topicId, topicIds, count, difficulty, language } = body;

    const resolvedTopicIds: string[] = Array.isArray(topicIds) && topicIds.length > 0
      ? topicIds
      : topicId ? [topicId] : [];

    if (!examVersionId || resolvedTopicIds.length === 0) {
      throw new BadRequestError("examVersionId and at least one topicId/topicIds are required");
    }

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await QuestionService.generateQuestionsForTopic({
      examVersionId,
      topicIds: resolvedTopicIds,
      count: count || 5,
      difficulty,
      language,
      user: session,
      ip,
      userAgent,
    });

    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
