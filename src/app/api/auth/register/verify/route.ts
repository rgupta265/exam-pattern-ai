import { NextRequest } from "next/server";
import { OtpService } from "@/services/auth/otp.service";
import { verifyOtpSchema } from "@/modules/auth/schemas/auth.schema";
import { errorResponse, successResponse } from "@/lib/response";
import { authConfig } from "@/config/auth.config";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = verifyOtpSchema.parse(body);

    const { user, token } = await OtpService.verifyRegistrationOtp({
      email: validated.email,
      otp: validated.otp,
    });

    const cookieStore = await cookies();
    cookieStore.set(authConfig.cookieName, token, authConfig.cookieOptions);

    return successResponse({ user, token }, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
