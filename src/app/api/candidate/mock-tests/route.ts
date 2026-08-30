import { NextRequest } from "next/server";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { generateTopicMockRequestSchema, mockFilterSchema } from "@/modules/mock/schemas/mock.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const filter = mockFilterSchema.parse({
      ...searchParams,
      isCandidateFacing: true,
    });

    const result = await MockEngineService.getMockTests(filter);

    // If candidate is logged in, attach their attempt history summary to each mock test
    if (session) {
      const mockIds = result.items.map((m) => m.id);
      const attempts = await prisma.testAttempt.findMany({
        where: {
          candidateId: session.id,
          mockTestId: { in: mockIds },
        },
        include: { testResult: true },
        orderBy: { startedAt: "desc" },
      });

      const enrichedItems = result.items.map((mock) => {
        const mockAttempts = attempts.filter((a) => a.mockTestId === mock.id);
        const inProgress = mockAttempts.find((a) => a.status === "IN_PROGRESS");
        const completed = mockAttempts.filter((a) => a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED");
        
        const scores = completed
          .map((a) => (a.testResult ? Number(a.testResult.percentage) : null))
          .filter((s): s is number => s !== null);
        
        const bestScore = scores.length > 0 ? Math.max(...scores) : null;
        const latestScore = scores.length > 0 ? scores[0] : null;
        const maxAttempts = 10;
        const canRetake = completed.length < maxAttempts;

        return {
          ...mock,
          userStats: {
            totalAttempts: completed.length,
            bestScore,
            latestScore,
            inProgressAttemptId: inProgress ? inProgress.id : null,
            latestAttemptId: mockAttempts.length > 0 ? mockAttempts[0].id : null,
            latestResultId: completed.length > 0 && completed[0].testResult ? completed[0].testResult.id : null,
            canRetake,
            maxAttempts,
          },
        };
      });

      return successResponse({
        ...result,
        items: enrichedItems,
      });
    }

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
    const validated = generateTopicMockRequestSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const mockTest = await MockEngineService.generateTopicPracticeMock(
      validated,
      session,
      ip,
      userAgent
    );

    return successResponse({ mockTest }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
