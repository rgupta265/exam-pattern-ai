import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      throw new UnauthorizedError("Not authenticated");
    }

    return successResponse({ user: session });
  } catch (error) {
    return errorResponse(error);
  }
}
