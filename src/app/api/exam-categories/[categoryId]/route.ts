import { NextRequest } from "next/server";
import { ExamCategoryService } from "@/services/exam/exam-category.service";
import { examCategorySchema } from "@/modules/exam/schemas/exam.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const category = await ExamCategoryService.getCategoryById(categoryId);
    return successResponse({ category });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { categoryId } = await params;
    const body = await req.json();
    const validated = examCategorySchema.partial().parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const updated = await ExamCategoryService.updateCategory(categoryId, validated, session, ip, userAgent);
    return successResponse({ category: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { categoryId } = await params;
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    await ExamCategoryService.deleteCategory(categoryId, session, ip, userAgent);
    return successResponse({ message: "Category successfully deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}
