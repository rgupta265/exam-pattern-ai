import { NextRequest } from "next/server";
import { SyllabusService } from "@/services/syllabus/syllabus.service";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ syllabusId: string }> }
) {
  try {
    const { syllabusId } = await params;
    const syllabus = await SyllabusService.getSyllabusById(syllabusId);
    return successResponse({ syllabus });
  } catch (error) {
    return errorResponse(error);
  }
}
