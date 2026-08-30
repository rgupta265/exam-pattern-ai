import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appConfig } from "@/config/app.config";

export async function GET() {
  let databaseStatus = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseStatus = "disconnected";
  }

  const isHealthy = databaseStatus === "connected";

  return NextResponse.json(
    {
      success: isHealthy,
      data: {
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: appConfig.version,
        database: databaseStatus,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
