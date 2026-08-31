import { NextRequest } from "next/server";
import { ActualPatternGeneratorService } from "@/services/mock/actual-pattern-generator.service";
import { patternSummaryQuerySchema } from "@/modules/mock/schemas/mock.schema";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const validated = patternSummaryQuerySchema.parse(searchParams);

    const plan = await ActualPatternGeneratorService.buildGenerationPlan(
      validated.examVersionId,
      validated.blueprintId
    );

    return successResponse({
      patternSummary: {
        examId: plan.examId,
        examName: plan.examName,
        examCode: plan.examCode,
        examVersionId: plan.examVersionId,
        versionName: plan.versionName,
        advertisementNumber: plan.advertisementNumber,
        blueprintId: plan.blueprintId,
        blueprintTitle: plan.blueprintTitle,
        totalQuestions: plan.totalQuestions,
        totalMarks: plan.totalMarks,
        durationMinutes: plan.durationMinutes,
        negativeMarkingRate: plan.negativeMarkingRate,
        difficulty: plan.difficulty,
        language: plan.language,
        totalAvailableQuestions: plan.totalAvailableQuestions,
        totalMissingQuestions: plan.totalMissingQuestions,
        isQuestionBankSufficient: plan.isQuestionBankSufficient,
        sections: plan.sections.map((sec) => ({
          sectionId: sec.sectionId,
          sectionName: sec.sectionName,
          sectionOrder: sec.sectionOrder,
          questionCount: sec.questionCount,
          marksPerQuestion: sec.marksPerQuestion,
          totalMarks: sec.totalMarks,
          negativeRate: sec.negativeRate,
          availableQuestionsCount: sec.availableQuestionsCount,
          missingQuestionsCount: sec.missingQuestionsCount,
        })),
        verifiedDocuments: plan.verifiedDocuments,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
