import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authConfig } from "./config/auth.config";
import { USER_ROLES } from "./lib/constants";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, Locale } from "./lib/i18n";

const SECRET_KEY = new TextEncoder().encode(authConfig.jwtSecret);

export async function proxy(request: NextRequest) {
  // Helper to attach standard security headers
  const attachSecurityHeaders = (res: NextResponse) => {
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.headers.set("X-XSS-Protection", "1; mode=block");
    return res;
  };

  // If already processed and rewritten internally, pass through
  if (request.headers.has("x-locale")) {
    return attachSecurityHeaders(NextResponse.next());
  }

  const { pathname, search } = request.nextUrl;

  // 1. Detect Locale Prefix (e.g., /en/..., /hi/..., /en, /hi)
  let locale: Locale = DEFAULT_LOCALE;
  let internalPath = pathname;
  let hasLocalePrefix = false;

  const pathSegments = pathname.split("/").filter(Boolean);
  if (pathSegments.length > 0 && SUPPORTED_LOCALES.includes(pathSegments[0] as Locale)) {
    locale = pathSegments[0] as Locale;
    hasLocalePrefix = true;
    const remainingSegments = pathSegments.slice(1);
    internalPath = remainingSegments.length > 0 ? `/${remainingSegments.join("/")}` : "/";
  } else {
    // Read from cookie if present
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale | undefined;
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      locale = cookieLocale;
    }
  }

  // 2. Handle Root & Non-API routes without locale prefix
  const isApiRoute = pathname.startsWith("/api");
  if (!hasLocalePrefix && !isApiRoute) {
    const redirectPath = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    const redirectUrl = new URL(redirectPath + search, request.url);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  // 3. Handle Legacy /docs Tour Redirects to Canonical App Routes
  if (internalPath.toLowerCase().includes("candidate_application_tour")) {
    const tourRedirect = new URL(`/${locale}/candidate/application-tour`, request.url);
    return NextResponse.redirect(tourRedirect);
  }
  if (internalPath.toLowerCase().includes("admin_application_tour")) {
    const tourRedirect = new URL(`/${locale}/admin/application-tour`, request.url);
    return NextResponse.redirect(tourRedirect);
  }

  // 4. Identify Route Categories
  const isAdminRoute = internalPath.startsWith("/admin");
  const isCandidateRoute = internalPath.startsWith("/candidate");
  const isProtectedApiRoute =
    internalPath.startsWith("/api/admin") ||
    internalPath.startsWith("/api/candidate");

  // Skip auth checks for public routes and static assets
  if (!isAdminRoute && !isCandidateRoute && !isProtectedApiRoute) {
    if (hasLocalePrefix) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-locale", locale);
      const rewriteUrl = new URL(internalPath + search, request.url);
      const res = NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
      res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
      res.headers.set("x-locale", locale);
      return attachSecurityHeaders(res);
    }
    return attachSecurityHeaders(NextResponse.next());
  }

  // 4. Extract Authentication Token
  const token =
    request.cookies.get(authConfig.cookieName)?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication token required" } },
        { status: 401 }
      );
    }
    const loginPath = hasLocalePrefix ? `/${locale}/login` : `/${locale}/login`;
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const roles = (payload.roles as string[]) || [];

    // 4. Admin RBAC Verification
    if (isAdminRoute) {
      const adminRoles: string[] = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.QUESTION_REVIEWER];
      const hasAdminAccess = roles.some((r) => adminRoles.includes(r));

      if (!hasAdminAccess) {
        const forbiddenPath = `/${locale}/forbidden`;
        return NextResponse.redirect(new URL(forbiddenPath, request.url));
      }
    }

    // 5. Clone headers for downstream use
    const requestHeaders = new Headers(request.headers);
    if (payload.sub) {
      requestHeaders.set("x-user-id", payload.sub);
    }
    requestHeaders.set("x-locale", locale);

    if (hasLocalePrefix) {
      const rewriteUrl = new URL(internalPath + search, request.url);
      const res = NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
      res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
      return attachSecurityHeaders(res);
    }

    return attachSecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  } catch {
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Session expired or invalid" } },
        { status: 401 }
      );
    }
    const loginPath = `/${locale}/login`;
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }
}

// Backward compatibility alias
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes not starting with admin/candidate (handled by internal handler)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
