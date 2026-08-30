import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/modules/auth/schemas/auth.schema";

describe("Validation Schemas", () => {
  it("should validate valid login input", () => {
    const valid = { email: "candidate@exampattern.ai", password: "Password123" };
    expect(() => loginSchema.parse(valid)).not.toThrow();
  });

  it("should reject invalid login email", () => {
    const invalid = { email: "not-an-email", password: "Password123" };
    expect(() => loginSchema.parse(invalid)).toThrow();
  });

  it("should validate valid candidate registration input", () => {
    const valid = {
      fullName: "Ramesh Sharma",
      email: "ramesh@example.com",
      password: "StrongPassword1",
      phoneNumber: "+919876543210",
    };
    expect(() => registerSchema.parse(valid)).not.toThrow();
  });

  it("should reject weak candidate password during registration", () => {
    const weak = {
      fullName: "Ramesh Sharma",
      email: "ramesh@example.com",
      password: "weak",
    };
    expect(() => registerSchema.parse(weak)).toThrow();
  });

  it("should validate forgot password input", () => {
    expect(() => forgotPasswordSchema.parse({ email: "user@example.com" })).not.toThrow();
    expect(() => forgotPasswordSchema.parse({ email: "invalid" })).toThrow();
  });
});
