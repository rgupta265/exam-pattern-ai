import { NextRequest } from "next/server";
import { BlueprintService } from "@/services/blueprint/blueprint.service";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ blueprintId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { blueprintId } = await params;
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const locked = await BlueprintService.lockBlueprint(
      blueprintId,
      session,
      ip,
      userAgent
    );

    return successResponse({ blueprint: locked });
  } catch (error) {
    return errorResponse(error);
  }
}
