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
    if (!isAdmin) throw new ForbiddenError("Only administrators can update tour videos");

    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const title = (formData.get("title") as string) || undefined;
    const description = (formData.get("description") as string) || undefined;
    const locale = (formData.get("locale") as string) || undefined;
    const isPublished = formData.has("isPublished") ? formData.get("isPublished") === "true" : undefined;

    if (!file) {
      throw new BadRequestError("Replacement video file is required");
    }

    const updated = await TourVideoService.replaceVideo(
      id,
      file,
      {
        title,
        description,
        locale,
        isPublished,
      },
      session.id
    );

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();
    const isAdmin = session.roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN");
    if (!isAdmin) throw new ForbiddenError("Only administrators can delete tour videos");

    const res = await TourVideoService.deleteVideo(id);
    return successResponse(res);
  } catch (error) {
    return errorResponse(error);
  }
}
