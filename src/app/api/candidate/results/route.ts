import { NextRequest } from "next/server";
import { ResultService } from "@/services/result/result.service";
import { resultFilterSchema } from "@/modules/result/schemas/result.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const filter = resultFilterSchema.parse(searchParams);

    const result = await ResultService.getCandidateResults(session.id, filter);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
