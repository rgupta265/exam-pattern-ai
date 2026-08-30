import { NextRequest } from "next/server";
import { ExamCategoryService } from "@/services/exam/exam-category.service";
import { examCategorySchema } from "@/modules/exam/schemas/exam.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET() {
  try {
    const categories = await ExamCategoryService.getAllCategories();
    return successResponse({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const body = await req.json();
    const validated = examCategorySchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const category = await ExamCategoryService.createCategory(validated, session, ip, userAgent);
    return successResponse({ category }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
