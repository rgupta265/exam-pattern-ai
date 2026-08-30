import { NextRequest } from "next/server";
import { OtpService } from "@/services/auth/otp.service";
import { forgotPasswordSchema } from "@/modules/auth/schemas/auth.schema";
import { errorResponse, successResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.parse(body);

    const result = await OtpService.initiateForgotPassword({
      email: validated.email,
      locale: validated.locale,
    });

    return successResponse(result, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
