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
    const body = await req.json().catch(() => ({}));
    const newTitle = body.title || "";

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const newDraft = await BlueprintService.createCorrigendumBlueprint(
      blueprintId,
      newTitle,
      session,
      ip,
      userAgent
    );

    return successResponse({ blueprint: newDraft }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
