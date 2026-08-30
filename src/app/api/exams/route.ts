import { NextRequest } from "next/server";
import { ExamService } from "@/services/exam/exam.service";
import { examFilterSchema, examSchema } from "@/modules/exam/schemas/exam.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const filter = examFilterSchema.parse(searchParams);

    const result = await ExamService.getExams(filter);
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
    const validated = examSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const exam = await ExamService.createExam(validated, session, ip, userAgent);
    return successResponse({ exam }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
