export const authConfig = {
  jwtSecret: process.env.AUTH_SECRET || "default-development-jwt-secret-min-32-chars-length!",
  jwtExpiresIn: process.env.AUTH_EXPIRES_IN || "7d",
  cookieName: "exampattern_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
};
