import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
    email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().optional(),
    phoneNumber: z.string().max(20).optional(),
    locale: z.enum(["en", "hi"]).optional().default("en"),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  locale: z.enum(["en", "hi"]).optional().default("en"),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  locale: z.enum(["en", "hi"]).optional().default("en"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
    otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
