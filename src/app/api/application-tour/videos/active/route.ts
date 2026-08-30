import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { TourVideoService } from "@/services/tour/tour-video.service";
import { errorResponse, successResponse } from "@/lib/response";
import { UnauthorizedError, BadRequestError } from "@/lib/errors";
import { TourVideoType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) throw new UnauthorizedError();

    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") || TourVideoType.CANDIDATE_END_TOUR;
    const localeParam = searchParams.get("locale") || "en";

    if (!Object.values(TourVideoType).includes(typeParam as TourVideoType)) {
      throw new BadRequestError("Invalid video type parameter");
    }

    const isAdmin = session.roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN");

    // If not admin and requesting FULL_APPLICATION_TOUR, reject
    if (!isAdmin && typeParam === TourVideoType.FULL_APPLICATION_TOUR) {
      return successResponse(null);
    }

    const activeVideo = await TourVideoService.getActiveVideo(
      typeParam as TourVideoType,
      localeParam,
      isAdmin
    );

    return successResponse(activeVideo);
  } catch (error) {
    return errorResponse(error);
  }
}
