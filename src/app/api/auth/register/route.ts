import { NextRequest } from "next/server";
import { OtpService } from "@/services/auth/otp.service";
import { registerSchema } from "@/modules/auth/schemas/auth.schema";
import { errorResponse, successResponse } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const result = await OtpService.initiateRegistration({
      fullName: validated.fullName,
      email: validated.email,
      password: validated.password,
      phoneNumber: validated.phoneNumber,
      locale: validated.locale,
    });

    return successResponse(result, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
