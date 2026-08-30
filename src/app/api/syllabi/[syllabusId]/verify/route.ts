import { NextRequest } from "next/server";
import { SyllabusService } from "@/services/syllabus/syllabus.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ syllabusId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { syllabusId } = await params;
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const verified = await SyllabusService.verifySyllabus(
      syllabusId,
      session,
      ip,
      userAgent
    );

    return successResponse({ syllabus: verified });
  } catch (error) {
    return errorResponse(error);
  }
}
