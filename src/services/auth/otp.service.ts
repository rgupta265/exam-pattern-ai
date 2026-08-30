import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { EmailService } from "@/services/email/email.service";
import { EmailTemplateService } from "@/services/email/email-template.service";
import { BadRequestError, NotFoundError, TooManyRequestsError } from "@/lib/errors";
import { UserRoleType, UserStatus } from "@prisma/client";
import { signToken } from "@/lib/auth";
import { AuthService } from "@/services/auth/auth.service";

export class OtpService {
  private static readonly OTP_EXPIRATION_MINUTES = 10;
  private static readonly MAX_OTP_ATTEMPTS = 5;
  private static readonly RESEND_COOLDOWN_SECONDS = 60;

  /**
   * Generates a cryptographically random 6-digit OTP
   */
  public static generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hashes an OTP using SHA-256 for secure database storage
   */
  public static hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  /**
   * Initiates candidate registration by sending an email verification OTP
   */
  public static async initiateRegistration(params: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    locale?: string;
  }): Promise<{ message: string; email: string; resendCooldownSeconds: number }> {
    const normalizedEmail = params.email.trim().toLowerCase();

    // Check if an active verified user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.emailVerifiedAt) {
      throw new BadRequestError("An account with this email address already exists. Please sign in.");
    }

    // Check existing pending email verification for resend cooldown
    const existingVerification = await prisma.emailVerification.findFirst({
      where: { email: normalizedEmail, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (existingVerification) {
      const elapsedSeconds = Math.floor((Date.now() - existingVerification.lastSentAt.getTime()) / 1000);
      if (elapsedSeconds < this.RESEND_COOLDOWN_SECONDS) {
        const remainingCooldown = this.RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        throw new TooManyRequestsError(`Please wait ${remainingCooldown} seconds before requesting a new verification code.`);
      }
    }

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000);
    const passwordHash = await bcrypt.hash(params.password, 10);

    // Create or update pending user record with unverified status
    let user = existingUser;
    if (!user) {
      const candidateRole = await prisma.role.findUnique({
        where: { code: UserRoleType.CANDIDATE },
      });

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: params.fullName.trim(),
          passwordHash,
          phoneNumber: params.phoneNumber?.trim() || null,
          status: UserStatus.ACTIVE,
          preferredLocale: params.locale === "hi" ? "hi" : "en",
          userRoles: candidateRole
            ? {
                create: {
                  roleId: candidateRole.id,
                },
              }
            : undefined,
        },
      });
    } else {
      // Update password hash and name if user was unverified
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: params.fullName.trim(),
          passwordHash,
          phoneNumber: params.phoneNumber?.trim() || null,
          preferredLocale: params.locale === "hi" ? "hi" : "en",
        },
      });
    }

    // Store secure hashed OTP in EmailVerification table
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        expiresAt,
        attemptCount: 0,
        lastSentAt: new Date(),
      },
    });

    // Send localized email
    const locale = params.locale === "hi" ? "hi" : "en";
    const emailData = EmailTemplateService.getRegistrationOtpEmail({
      appName: "ExamPattern AI",
      recipientName: params.fullName.trim(),
      otp,
      expiresInMinutes: this.OTP_EXPIRATION_MINUTES,
      locale,
    });

    await EmailService.sendEmail({
      to: normalizedEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      locale,
    });

    return {
      message: "Verification code sent to your email address",
      email: normalizedEmail,
      resendCooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * Verifies candidate email OTP and activates user session
   */
  public static async verifyRegistrationOtp(params: {
    email: string;
    otp: string;
  }): Promise<{ token: string; user: { id: string; email: string; fullName: string; role: string } }> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const inputHash = this.hashOtp(params.otp.trim());

    const record = await prisma.emailVerification.findFirst({
      where: { email: normalizedEmail, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new BadRequestError("No active verification code found for this email. Please request a new code.");
    }

    if (record.attemptCount >= this.MAX_OTP_ATTEMPTS) {
      throw new BadRequestError("Maximum verification attempts exceeded. Please request a new verification code.");
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestError("Verification code has expired. Please request a new code.");
    }

    if (record.otpHash !== inputHash) {
      await prisma.emailVerification.update({
        where: { id: record.id },
        data: { attemptCount: { increment: 1 } },
      });
      const remaining = this.MAX_OTP_ATTEMPTS - (record.attemptCount + 1);
      throw new BadRequestError(`Invalid verification code. ${remaining} attempts remaining.`);
    }

    // Mark verification record as verified
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    // Mark user email as verified
    const user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        emailVerifiedAt: new Date(),
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    // Ensure CandidateProfile exists for user
    await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        completionPercentage: 10,
      },
    });

    const sessionUser = await AuthService.getUserSessionData(user.id);
    if (!sessionUser) {
      throw new BadRequestError("Failed to initialize session for verified user");
    }

    const token = await signToken({
      sub: sessionUser.id,
      email: sessionUser.email,
      fullName: sessionUser.fullName,
      roles: sessionUser.roles,
      permissions: sessionUser.permissions,
    });

    return {
      token,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        fullName: sessionUser.fullName,
        role: sessionUser.roles[0] || UserRoleType.CANDIDATE,
      },
    };
  }

  /**
   * Resends registration email verification OTP with cooldown check
   */
  public static async resendRegistrationOtp(params: {
    email: string;
    locale?: string;
  }): Promise<{ message: string; resendCooldownSeconds: number }> {
    const normalizedEmail = params.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundError("Registration record not found. Please register again.");
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestError("This account is already verified. Please sign in.");
    }

    const latestVerification = await prisma.emailVerification.findFirst({
      where: { email: normalizedEmail, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (latestVerification) {
      const elapsedSeconds = Math.floor((Date.now() - latestVerification.lastSentAt.getTime()) / 1000);
      if (elapsedSeconds < this.RESEND_COOLDOWN_SECONDS) {
        const remaining = this.RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        throw new TooManyRequestsError(`Please wait ${remaining} seconds before requesting a new code.`);
      }
    }

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        otpHash,
        expiresAt,
        attemptCount: 0,
        lastSentAt: new Date(),
      },
    });

    const locale = params.locale === "hi" ? "hi" : "en";
    const emailData = EmailTemplateService.getRegistrationOtpEmail({
      appName: "ExamPattern AI",
      recipientName: user.fullName,
      otp,
      expiresInMinutes: this.OTP_EXPIRATION_MINUTES,
      locale,
    });

    await EmailService.sendEmail({
      to: normalizedEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      locale,
    });

    return {
      message: "A fresh verification code has been sent to your email address",
      resendCooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * Initiates forgot password flow by generating and emailing a password reset OTP
   */
  public static async initiateForgotPassword(params: {
    email: string;
    locale?: string;
  }): Promise<{ message: string; email: string; resendCooldownSeconds: number }> {
    const normalizedEmail = params.email.trim().toLowerCase();

    // Generic safe response whether user exists or not (Zero enumeration leak)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const latestReset = await prisma.passwordResetOTP.findFirst({
        where: { email: normalizedEmail, usedAt: null },
        orderBy: { createdAt: "desc" },
      });

      if (latestReset) {
        const elapsedSeconds = Math.floor((Date.now() - latestReset.lastSentAt.getTime()) / 1000);
        if (elapsedSeconds < this.RESEND_COOLDOWN_SECONDS) {
          const remaining = this.RESEND_COOLDOWN_SECONDS - elapsedSeconds;
          throw new TooManyRequestsError(`Please wait ${remaining} seconds before requesting another reset code.`);
        }
      }

      const otp = this.generateOtp();
      const otpHash = this.hashOtp(otp);
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000);

      await prisma.passwordResetOTP.create({
        data: {
          userId: user.id,
          email: normalizedEmail,
          otpHash,
          expiresAt,
          attemptCount: 0,
          lastSentAt: new Date(),
        },
      });

      const locale = params.locale === "hi" ? "hi" : "en";
      const emailData = EmailTemplateService.getPasswordResetOtpEmail({
        appName: "ExamPattern AI",
        recipientName: user.fullName,
        otp,
        expiresInMinutes: this.OTP_EXPIRATION_MINUTES,
        locale,
      });

      await EmailService.sendEmail({
        to: normalizedEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        locale,
      });
    }

    return {
      message: "If an account exists with this email address, a password reset code has been sent.",
      email: normalizedEmail,
      resendCooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * Verifies password reset OTP and updates user password
   */
  public static async resetPasswordWithOtp(params: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const inputHash = this.hashOtp(params.otp.trim());

    const record = await prisma.passwordResetOTP.findFirst({
      where: { email: normalizedEmail, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new BadRequestError("Invalid or expired reset request. Please request a new password reset code.");
    }

    if (record.attemptCount >= this.MAX_OTP_ATTEMPTS) {
      throw new BadRequestError("Maximum reset code attempts exceeded. Please request a new code.");
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestError("Reset code has expired. Please request a new code.");
    }

    if (record.otpHash !== inputHash) {
      await prisma.passwordResetOTP.update({
        where: { id: record.id },
        data: { attemptCount: { increment: 1 } },
      });
      const remaining = this.MAX_OTP_ATTEMPTS - (record.attemptCount + 1);
      throw new BadRequestError(`Invalid reset code. ${remaining} attempts remaining.`);
    }

    // Mark reset OTP as used
    await prisma.passwordResetOTP.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Update user password with fresh bcrypt hash
    const passwordHash = await bcrypt.hash(params.newPassword, 10);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    return {
      success: true,
      message: "Your password has been successfully updated. You can now sign in with your new password.",
    };
  }
}
