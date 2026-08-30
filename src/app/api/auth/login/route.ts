import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth/auth.service";
import { loginSchema } from "@/modules/auth/schemas/auth.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { authConfig } from "@/config/auth.config";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const { user, token } = await AuthService.login(validated, ip, userAgent);

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(authConfig.cookieName, token, authConfig.cookieOptions);

    return successResponse({ user, token });
  } catch (error) {
    return errorResponse(error);
  }
}
