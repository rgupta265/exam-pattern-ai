import { describe, it, expect } from "vitest";
import { OtpService } from "@/services/auth/otp.service";
import { EmailTemplateService } from "@/services/email/email-template.service";
import { CandidateProfileService } from "@/services/candidate/candidate-profile.service";
import { Gender } from "@prisma/client";

describe("Phase 15: Full-Screen Exam, Email/OTP Auth & Candidate Profile Tests", () => {
  describe("Email Template Localization", () => {
    it("should generate English registration OTP email with security warnings", () => {
      const email = EmailTemplateService.getRegistrationOtpEmail({
        appName: "ExamPattern AI",
        recipientName: "Rahul Sharma",
        otp: "543210",
        expiresInMinutes: 10,
        locale: "en",
      });

      expect(email.subject).toContain("Email Verification Code: 543210");
      expect(email.text).toContain("Hello Rahul Sharma");
      expect(email.text).toContain("543210");
      expect(email.html).toContain("543210");
      expect(email.text).toContain("10 minutes");
      expect(email.text).toContain("do not share this code");
    });

    it("should generate Hindi registration OTP email with security warnings", () => {
      const email = EmailTemplateService.getRegistrationOtpEmail({
        appName: "ExamPattern AI",
        recipientName: "राहुल शर्मा",
        otp: "654321",
        expiresInMinutes: 10,
        locale: "hi",
      });

      expect(email.subject).toContain("ईमेल सत्यापन कोड: 654321");
      expect(email.text).toContain("नमस्ते राहुल शर्मा");
      expect(email.text).toContain("654321");
      expect(email.html).toContain("654321");
      expect(email.text).toContain("10 मिनट");
      expect(email.text).toContain("साझा न करें");
    });

    it("should generate bilingual password reset OTP emails", () => {
      const emailEn = EmailTemplateService.getPasswordResetOtpEmail({
        appName: "ExamPattern AI",
        otp: "987654",
        expiresInMinutes: 10,
        locale: "en",
      });
      const emailHi = EmailTemplateService.getPasswordResetOtpEmail({
        appName: "ExamPattern AI",
        otp: "987654",
        expiresInMinutes: 10,
        locale: "hi",
      });

      expect(emailEn.subject).toContain("Password Reset Code: 987654");
      expect(emailHi.subject).toContain("पासवर्ड रीसेट सत्यापन कोड: 987654");
    });
  });

  describe("OTP Generation & Hashing Security", () => {
    it("should generate cryptographically random 6-digit numeric OTPs", () => {
      const otp1 = OtpService.generateOtp();
      const otp2 = OtpService.generateOtp();

      expect(otp1).toHaveLength(6);
      expect(otp2).toHaveLength(6);
      expect(/^\d{6}$/.test(otp1)).toBe(true);
      expect(/^\d{6}$/.test(otp2)).toBe(true);
      expect(otp1).not.toEqual(otp2);
    });

    it("should produce consistent SHA-256 hex hashes for OTPs", () => {
      const otp = "123456";
      const hash1 = OtpService.hashOtp(otp);
      const hash2 = OtpService.hashOtp(otp);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 is 64 hex characters
      expect(hash1).not.toBe(otp);    // Never stored in plaintext
    });
  });

  describe("Candidate Profile Completion Calculation", () => {
    it("should calculate baseline score for fresh candidate profile", () => {
      const baseScore = CandidateProfileService.computeCompletionPercentage({
        user: { fullName: "A", phoneNumber: null },
      });
      expect(baseScore).toBe(20);
    });

    it("should calculate progressive score as fields and records are added", () => {
      const fullProfile = {
        user: { fullName: "Ananya Patel", phoneNumber: "+91 9876543210" },
        dateOfBirth: new Date("1998-05-15"),
        gender: Gender.FEMALE,
        address: { city: "Lucknow", state: "UP" },
        educations: [{ id: "edu-1", qualification: "B.Sc Nursing" }],
        experiences: [{ id: "exp-1", jobTitle: "Staff Nurse" }],
      };

      const score = CandidateProfileService.computeCompletionPercentage(fullProfile);
      expect(score).toBe(100);
    });
  });
});
