import { NextRequest } from "next/server";
import { BlueprintService } from "@/services/blueprint/blueprint.service";
import { updateBlueprintSchema } from "@/modules/blueprint/schemas/blueprint.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { getServerSession } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ blueprintId: string }> }
) {
  try {
    const { blueprintId } = await params;
    const blueprint = await BlueprintService.getBlueprintById(blueprintId);
    return successResponse({ blueprint });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ blueprintId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { blueprintId } = await params;
    const body = await req.json();
    const validated = updateBlueprintSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const updated = await BlueprintService.updateBlueprint(
      blueprintId,
      validated,
      session,
      ip,
      userAgent
    );

    return successResponse({ blueprint: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
