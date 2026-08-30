import { NextRequest } from "next/server";
import { ResultService } from "@/services/result/result.service";
import { questionReviewFilterSchema } from "@/modules/result/schemas/result.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { resultId } = await params;
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const filter = questionReviewFilterSchema.parse(searchParams);

    const result = await ResultService.getDetailedQuestions(resultId, session.id, filter);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
