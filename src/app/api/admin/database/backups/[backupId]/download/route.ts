import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getServerSession } from "@/lib/auth";
import { RbacService } from "@/services/rbac/rbac.service";
import { DatabaseManagementService } from "@/services/database/database-management.service";
import { errorResponse } from "@/lib/response";
import { PERMISSIONS } from "@/lib/constants";

interface RouteContext {
  params: Promise<{ backupId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession();
    RbacService.requirePermission(session, PERMISSIONS.DATABASE_BACKUP_DOWNLOAD);

    const { backupId } = await context.params;
    const { filePath, filename, sizeBytes } = await DatabaseManagementService.getBackupForDownload(
      backupId,
      session!.id
    );

    const fileStream = fs.createReadStream(filePath);

    // Stream the file as attachment
    const headers = new Headers();
    headers.set("Content-Type", "application/sql");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Length", sizeBytes.toString());
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    return new NextResponse(fileStream as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
