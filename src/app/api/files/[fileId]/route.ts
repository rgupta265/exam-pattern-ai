import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/services/storage";
import { getServerSession } from "@/lib/auth";
import { errorResponse } from "@/lib/response";
import { NotFoundError, UnauthorizedError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const metadata = await storageService.getFileMetadata(fileId);

    if (!metadata) {
      throw new NotFoundError("File");
    }

    // If file is private, require active authenticated session
    if (metadata.visibility === "PRIVATE") {
      const session = await getServerSession();
      if (!session) {
        throw new UnauthorizedError("Authentication required to access this file");
      }
    }

    const fileBuffer = await storageService.readFile(metadata.storagePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": metadata.mimeType,
        "Content-Length": metadata.fileSize.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent(metadata.originalName)}"`,
        "Cache-Control": metadata.visibility === "PUBLIC" ? "public, max-age=86400" : "private, no-cache",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
