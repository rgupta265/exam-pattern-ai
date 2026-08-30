import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, signToken, verifyToken } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

describe("Auth Core Utilities", () => {
  it("should securely hash and verify passwords", async () => {
    const rawPassword = "SecurePassword@123";
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword("WrongPassword", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should sign and verify valid JWT session tokens", async () => {
    const sessionData = {
      sub: "user-123",
      email: "test@exampattern.ai",
      fullName: "Test User",
      roles: [USER_ROLES.CANDIDATE],
      permissions: ["CANDIDATE_SELF_ATTEMPT"],
    };

    const token = await signToken(sessionData);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("user-123");
    expect(verified?.email).toBe("test@exampattern.ai");
    expect(verified?.roles).toContain(USER_ROLES.CANDIDATE);
    expect(verified?.permissions).toContain("CANDIDATE_SELF_ATTEMPT");
  });

  it("should return null for tampered or invalid tokens", async () => {
    const invalid = await verifyToken("invalid.token.structure");
    expect(invalid).toBeNull();
  });
});
