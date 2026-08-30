import { NextRequest } from "next/server";
import { OtpService } from "@/services/auth/otp.service";
import { resetPasswordSchema } from "@/modules/auth/schemas/auth.schema";
import { errorResponse, successResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.parse(body);

    const result = await OtpService.resetPasswordWithOtp({
      email: validated.email,
      otp: validated.otp,
      newPassword: validated.newPassword,
    });

    return successResponse(result, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
