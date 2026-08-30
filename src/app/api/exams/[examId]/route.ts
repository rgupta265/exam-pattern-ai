import { NextRequest } from "next/server";
import { ExamService } from "@/services/exam/exam.service";
import { examSchema } from "@/modules/exam/schemas/exam.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;
    const url = new URL(req.url);
    const isCandidate = url.searchParams.get("candidate") === "true";

    const exam = await ExamService.getExamById(examId, isCandidate);
    return successResponse({ exam });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { examId } = await params;
    const body = await req.json();
    const validated = examSchema.partial().parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const updated = await ExamService.updateExam(examId, validated, session, ip, userAgent);
    return successResponse({ exam: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { examId } = await params;
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    await ExamService.deleteExam(examId, session, ip, userAgent);
    return successResponse({ message: "Exam successfully archived" });
  } catch (error) {
    return errorResponse(error);
  }
}
