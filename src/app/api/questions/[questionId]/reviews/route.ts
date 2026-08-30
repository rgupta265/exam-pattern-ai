import { NextRequest } from "next/server";
import { QuestionService } from "@/services/question/question.service";
import { questionReviewSchema } from "@/modules/question/schemas/question.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { questionId } = await params;
    const body = await req.json();
    const validated = questionReviewSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await QuestionService.createReview(questionId, validated, session, ip, userAgent);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
