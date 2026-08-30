import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { TourVideoService } from "@/services/tour/tour-video.service";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError, ForbiddenError, BadRequestError } from "@/lib/errors";
import { TourVideoType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();
    const isAdmin = session.roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN");
    if (!isAdmin) throw new ForbiddenError("Only administrators can manage tour videos");

    const videos = await TourVideoService.listAllVideos();
    return successResponse(videos);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();
    const isAdmin = session.roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN");
    if (!isAdmin) throw new ForbiddenError("Only administrators can upload tour videos");

    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const type = (formData.get("type") as TourVideoType) || TourVideoType.FULL_APPLICATION_TOUR;
    const title = (formData.get("title") as string) || "Application Tour Video";
    const description = (formData.get("description") as string) || undefined;
    const locale = (formData.get("locale") as string) || "all";
    const isPublished = formData.get("isPublished") === "true";

    if (!file) {
      throw new BadRequestError("Video file is required");
    }

    if (!Object.values(TourVideoType).includes(type)) {
      throw new BadRequestError("Invalid video type. Allowed: FULL_APPLICATION_TOUR, CANDIDATE_END_TOUR");
    }

    const video = await TourVideoService.uploadVideo(
      file,
      {
        type,
        title,
        description,
        locale,
        isPublished,
      },
      session.id
    );

    return successResponse(video, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
