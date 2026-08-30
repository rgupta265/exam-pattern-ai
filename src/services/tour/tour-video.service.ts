import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TourVideoType, Prisma } from "@prisma/client";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/lib/errors";

const ALLOWED_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_EXTENSIONS = [".mp4", ".webm", ".mov"];
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB default max

export class TourVideoService {
  /**
   * Get the private storage directory for tour videos
   */
  static getStorageDir(): string {
    const baseDir = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
    const tourDir = path.join(baseDir, "private", "application-tours");
    if (!fs.existsSync(tourDir)) {
      fs.mkdirSync(tourDir, { recursive: true });
    }
    return tourDir;
  }

  /**
   * Validate uploaded video buffer/metadata
   */
  static validateVideoFile(file: File) {
    if (!file || file.size === 0) {
      throw new BadRequestError("A valid video file is required");
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      throw new BadRequestError(`Video file size exceeds maximum limit of ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB`);
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestError(`Unsupported video format (${mimeType}). Allowed formats: MP4, WebM, QuickTime (MOV)`);
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestError(`Unsupported file extension (${ext}). Allowed extensions: .mp4, .webm, .mov`);
    }

    return { mimeType, ext };
  }

  /**
   * Upload a new tour video
   */
  static async uploadVideo(
    file: File,
    data: {
      type: TourVideoType;
      title: string;
      description?: string;
      locale?: string;
      isPublished?: boolean;
    },
    userId: string
  ) {
    const { mimeType, ext } = this.validateVideoFile(file);
    const storageDir = this.getStorageDir();

    const safeFileName = `tour-${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(storageDir, safeFileName);

    // Write file to secure local private storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destinationPath, buffer);

    try {
      const videoRecord = await prisma.applicationTourVideo.create({
        data: {
          type: data.type,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          fileName: safeFileName,
          filePath: destinationPath,
          mimeType,
          fileSize: file.size,
          locale: data.locale || "all",
          isPublished: data.isPublished ?? false,
          createdById: userId,
        },
      });

      return videoRecord;
    } catch (dbError) {
      // Clean up orphaned file on database error
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath);
      }
      throw dbError;
    }
  }

  /**
   * Replace an existing tour video file and metadata
   */
  static async replaceVideo(
    videoId: string,
    file: File,
    data: {
      title?: string;
      description?: string;
      locale?: string;
      isPublished?: boolean;
    },
    _userId: string
  ) {
    const existing = await prisma.applicationTourVideo.findUnique({
      where: { id: videoId },
    });

    if (!existing) {
      throw new NotFoundError("Tour video not found");
    }

    const { mimeType, ext } = this.validateVideoFile(file);
    const storageDir = this.getStorageDir();

    const newSafeFileName = `tour-${crypto.randomUUID()}${ext}`;
    const newDestinationPath = path.join(storageDir, newSafeFileName);

    // Write new file first
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(newDestinationPath, buffer);

    const oldFilePath = existing.filePath;

    try {
      const updated = await prisma.applicationTourVideo.update({
        where: { id: videoId },
        data: {
          title: data.title ? data.title.trim() : existing.title,
          description: data.description !== undefined ? data.description.trim() : existing.description,
          fileName: newSafeFileName,
          filePath: newDestinationPath,
          mimeType,
          fileSize: file.size,
          locale: data.locale || existing.locale,
          isPublished: data.isPublished ?? existing.isPublished,
        },
      });

      // Safely delete old file now that DB update succeeded
      if (fs.existsSync(oldFilePath) && oldFilePath !== newDestinationPath) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          console.warn("Failed to remove old tour video file:", oldFilePath, e);
        }
      }

      return updated;
    } catch (err) {
      // If DB update failed, delete the newly written file
      if (fs.existsSync(newDestinationPath)) {
        fs.unlinkSync(newDestinationPath);
      }
      throw err;
    }
  }

  /**
   * Toggle video publication status
   */
  static async togglePublish(videoId: string, isPublished: boolean) {
    const video = await prisma.applicationTourVideo.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundError("Tour video not found");
    }

    return prisma.applicationTourVideo.update({
      where: { id: videoId },
      data: { isPublished },
    });
  }

  /**
   * Delete a tour video safely
   */
  static async deleteVideo(videoId: string) {
    const video = await prisma.applicationTourVideo.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundError("Tour video not found");
    }

    const filePath = video.filePath;

    await prisma.applicationTourVideo.delete({
      where: { id: videoId },
    });

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("Failed to delete physical video file:", filePath, err);
      }
    }

    return { success: true };
  }

  /**
   * Get active published video for a specific type & locale
   */
  static async getActiveVideo(type: TourVideoType, locale: string = "en", isAdmin: boolean = false) {
    const whereClause: Prisma.ApplicationTourVideoWhereInput = {
      type,
    };

    if (!isAdmin) {
      whereClause.isPublished = true;
    }

    // Try exact locale match first, then "all", then fallback to any
    const videos = await prisma.applicationTourVideo.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
    });

    if (videos.length === 0) return null;

    // 1. Check exact locale
    const exactMatch = videos.find((v) => v.locale === locale);
    if (exactMatch) return exactMatch;

    // 2. Check "all" locale
    const allMatch = videos.find((v) => v.locale === "all");
    if (allMatch) return allMatch;

    // 3. Fallback to first available video
    return videos[0];
  }

  /**
   * List all tour videos (Admin view)
   */
  static async listAllVideos() {
    return prisma.applicationTourVideo.findMany({
      orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get verified streaming file path with strict authorization
   */
  static async getVerifiedStreamData(videoId: string, isCandidate: boolean) {
    const video = await prisma.applicationTourVideo.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundError("Video not found");
    }

    // Candidates can only stream published candidate end tour videos
    if (isCandidate) {
      if (video.type !== TourVideoType.CANDIDATE_END_TOUR || !video.isPublished) {
        throw new ForbiddenError("You do not have permission to access this video");
      }
    }

    // Verify physical file exists and is within storage directory (Path Traversal Protection)
    const storageDir = this.getStorageDir();
    const normalizedTarget = path.normalize(video.filePath);
    const normalizedStorage = path.normalize(storageDir);

    if (!normalizedTarget.startsWith(normalizedStorage)) {
      throw new ForbiddenError("Invalid file path location");
    }

    if (!fs.existsSync(normalizedTarget)) {
      throw new NotFoundError("Physical video file not found on disk");
    }

    const stat = fs.statSync(normalizedTarget);
    return {
      filePath: normalizedTarget,
      mimeType: video.mimeType,
      fileSize: stat.size,
    };
  }
}
