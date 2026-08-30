import { NextRequest } from "next/server";
import { QuestionService } from "@/services/question/question.service";
import { updateQuestionSchema } from "@/modules/question/schemas/question.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const question = await QuestionService.getQuestionById(questionId);
    return successResponse({ question });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { questionId } = await params;
    const body = await req.json();
    const validated = updateQuestionSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const updated = await QuestionService.updateQuestion(questionId, validated, session, ip, userAgent);
    return successResponse({ question: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
