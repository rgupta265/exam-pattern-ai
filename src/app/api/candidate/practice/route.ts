import { CandidatePracticeService } from "@/services/candidate/candidate-practice.service";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getServerSession();
    if (!user) {
      return errorResponse(new UnauthorizedError("Authentication required"));
    }

    const tests = await CandidatePracticeService.getPracticeTests(user.id);
    return successResponse(tests);
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
