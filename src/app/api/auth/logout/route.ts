import { authConfig } from "@/config/auth.config";
import { cookies } from "next/headers";
import { successResponse } from "@/lib/response";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(authConfig.cookieName, "", {
    ...authConfig.cookieOptions,
    maxAge: 0,
  });

  return successResponse({ message: "Successfully logged out" });
}
