import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { TourVideoService } from "@/services/tour/tour-video.service";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError, ForbiddenError, BadRequestError } from "@/lib/errors";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();
    const isAdmin = session.roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN");
    if (!isAdmin) throw new ForbiddenError("Only administrators can toggle publication status");

    const body = await req.json();
    if (typeof body.isPublished !== "boolean") {
      throw new BadRequestError("isPublished boolean value is required");
    }

    const updated = await TourVideoService.togglePublish(id, body.isPublished);
    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
