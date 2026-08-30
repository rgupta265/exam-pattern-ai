import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getServerSession } from "@/lib/auth";
import { TourVideoService } from "@/services/tour/tour-video.service";
import { Readable } from "stream";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN");
    const isCandidate = session.roles.includes("CANDIDATE") && !isAdmin;

    const streamData = await TourVideoService.getVerifiedStreamData(id, isCandidate);
    const { filePath, mimeType, fileSize } = streamData;

    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(fileStream) as unknown as ReadableStream;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": mimeType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Full stream
    const fileStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(fileStream) as unknown as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: unknown) {
    const isNotFound = error instanceof Error && error.name === "NotFoundError";
    const status = isNotFound ? 404 : 403;
    const message = error instanceof Error ? error.message : "Failed to stream video";
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
