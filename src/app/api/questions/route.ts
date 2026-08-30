import { NextRequest } from "next/server";
import { QuestionService } from "@/services/question/question.service";
import { createQuestionSchema, questionFilterSchema } from "@/modules/question/schemas/question.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const filter = questionFilterSchema.parse(searchParams);

    const result = await QuestionService.getQuestions(filter);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const validated = createQuestionSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const question = await QuestionService.createQuestion(validated, session, ip, userAgent);
    return successResponse({ question }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
