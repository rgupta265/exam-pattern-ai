import { NextRequest } from "next/server";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { generateFullMockRequestSchema, mockFilterSchema } from "@/modules/mock/schemas/mock.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const filter = mockFilterSchema.parse(searchParams);

    const result = await MockEngineService.getMockTests(filter);
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
    const validated = generateFullMockRequestSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await MockEngineService.generateFullExamMock(validated, session, ip, userAgent);
    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
