import { NextRequest } from "next/server";
import { ExamVersionService } from "@/services/exam/exam-version.service";
import { examVersionSchema } from "@/modules/exam/schemas/exam.schema";
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

    const versions = await ExamVersionService.getVersionsByExamId(examId, isCandidate);
    return successResponse({ versions });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { examId } = await params;
    const body = await req.json();
    const validated = examVersionSchema.parse({ ...body, examId });

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const version = await ExamVersionService.createVersion(validated, session, ip, userAgent);
    return successResponse({ version }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
