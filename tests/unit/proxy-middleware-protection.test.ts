import { describe, it, expect, vi, beforeEach } from "vitest";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { authConfig } from "@/config/auth.config";
import { USER_ROLES } from "@/lib/constants";

const SECRET_KEY = new TextEncoder().encode(authConfig.jwtSecret);

async function createTestToken(payload: { sub: string; roles: string[]; email?: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(SECRET_KEY);
}

describe("Next.js 16 Proxy / Middleware Route Protection & RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Public Routes & Locale Normalization", () => {
    it("should redirect root '/' to default canonical locale '/en'", async () => {
      const req = new NextRequest("http://localhost:3000/");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/en");
    });

    it("should allow public login route without authentication", async () => {
      const req = new NextRequest("http://localhost:3000/en/login");
      const res = await proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    });

    it("should allow public register route without authentication", async () => {
      const req = new NextRequest("http://localhost:3000/en/register");
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });

    it("should allow public forgot-password route without authentication", async () => {
      const req = new NextRequest("http://localhost:3000/en/forgot-password");
      const res = await proxy(req);

      expect(res.status).toBe(200);
    });
  });

  describe("Candidate Route Protection", () => {
    it("should redirect unauthenticated candidate requests to /en/login with callbackUrl", async () => {
      const req = new NextRequest("http://localhost:3000/en/candidate/dashboard");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/en/login");
      expect(res.headers.get("location")).toContain("callbackUrl=%2Fen%2Fcandidate%2Fdashboard");
    });

    it("should allow authenticated candidate with valid JWT token", async () => {
      const token = await createTestToken({
        sub: "candidate-user-123",
        roles: [USER_ROLES.CANDIDATE],
      });

      const req = new NextRequest("http://localhost:3000/en/candidate/dashboard", {
        headers: {
          cookie: `${authConfig.cookieName}=${token}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    });

    it("should redirect to login if token is expired or invalid", async () => {
      const req = new NextRequest("http://localhost:3000/en/candidate/mock-tests", {
        headers: {
          cookie: `${authConfig.cookieName}=invalid-malformed-token`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/en/login");
    });
  });

  describe("Admin Route Protection & RBAC Enforcement", () => {
    it("should redirect unauthenticated admin requests to /en/login", async () => {
      const req = new NextRequest("http://localhost:3000/en/admin/dashboard");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/en/login");
    });

    it("should BLOCK candidate role from accessing /admin/* and redirect to /en/forbidden", async () => {
      const candidateToken = await createTestToken({
        sub: "candidate-user-456",
        roles: [USER_ROLES.CANDIDATE],
      });

      const req = new NextRequest("http://localhost:3000/en/admin/database", {
        headers: {
          cookie: `${authConfig.cookieName}=${candidateToken}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/en/forbidden");
    });

    it("should ALLOW SUPER_ADMIN role to access /admin/*", async () => {
      const superAdminToken = await createTestToken({
        sub: "superadmin-1",
        roles: [USER_ROLES.SUPER_ADMIN],
      });

      const req = new NextRequest("http://localhost:3000/en/admin/exams", {
        headers: {
          cookie: `${authConfig.cookieName}=${superAdminToken}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
    });

    it("should ALLOW ADMIN role to access /admin/*", async () => {
      const adminToken = await createTestToken({
        sub: "admin-1",
        roles: [USER_ROLES.ADMIN],
      });

      const req = new NextRequest("http://localhost:3000/en/admin/dashboard", {
        headers: {
          cookie: `${authConfig.cookieName}=${adminToken}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
    });

    it("should ALLOW QUESTION_REVIEWER role to access /admin/*", async () => {
      const reviewerToken = await createTestToken({
        sub: "reviewer-1",
        roles: [USER_ROLES.QUESTION_REVIEWER],
      });

      const req = new NextRequest("http://localhost:3000/en/admin/question-reviews", {
        headers: {
          cookie: `${authConfig.cookieName}=${reviewerToken}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Protected API Route Rejection", () => {
    it("should return HTTP 401 JSON for /api/admin/* when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/candidates");
      const res = await proxy(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("should return HTTP 401 JSON for /api/candidate/* when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/candidate/attempts");
      const res = await proxy(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });
});
