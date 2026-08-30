import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { AttemptService } from "@/services/attempt/attempt.service";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/errors";

interface RouteContext {
  params: Promise<{ attemptId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getServerSession();
    if (!user) throw new UnauthorizedError();

    const { attemptId } = await context.params;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          include: {
            examVersion: { include: { exam: true } },
            blueprint: true,
          },
        },
      },
    });

    if (!attempt) throw new NotFoundError("Test Attempt");
    if (attempt.candidateId !== user.id) throw new ForbiddenError("Unauthorized attempt access.");

    const mock = attempt.mockTest;
    const exam = mock.examVersion.exam;

    return successResponse({
      attemptId: attempt.id,
      mockId: mock.id,
      mockCode: mock.code,
      mockTitle: mock.title,
      examName: exam.name,
      authority: exam.authority,
      totalQuestions: mock.totalQuestions,
      totalMarks: Number(mock.totalMarks),
      durationMinutes: mock.durationMinutes,
      negativeRate: Number(mock.negativeRate),
      language: mock.language,
      instructions: mock.instructions || mock.blueprint?.instructions || null,
      instructionsHindi: mock.instructionsHindi || null,
      isAcknowledged: !!attempt.instructionsAcknowledgedAt,
      instructionsLanguage: attempt.instructionsLanguage || "BILINGUAL",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getServerSession();
    if (!user) throw new UnauthorizedError();

    const { attemptId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const language = body.language || "BILINGUAL";

    const updated = await AttemptService.acknowledgeInstructions(attemptId, user.id, language);

    return successResponse({
      success: true,
      attemptId: updated.id,
      instructionsAcknowledgedAt: updated.instructionsAcknowledgedAt,
      attemptLanguage: updated.attemptLanguage,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
