import { describe, it, expect } from "vitest";
import path from "path";
import { TourVideoService } from "@/services/tour/tour-video.service";
import { UrlContentExtractorService } from "@/services/ai/url-content-extractor.service";
import { registerSchema } from "@/modules/auth/schemas/auth.schema";
import { TourVideoType } from "@prisma/client";

describe("Phase 14: Security, Video Management & Role-Aware Routing Tests", () => {
  describe("Tour Video File Validation & Path Safety", () => {
    it("should accept valid MP4 and WebM video files", () => {
      const mockMp4 = new File(["dummy video data"], "walkthrough.mp4", { type: "video/mp4" });
      const mockWebm = new File(["dummy video data"], "walkthrough.webm", { type: "video/webm" });

      expect(() => TourVideoService.validateVideoFile(mockMp4)).not.toThrow();
      expect(() => TourVideoService.validateVideoFile(mockWebm)).not.toThrow();
    });

    it("should reject disallowed MIME types and file extensions", () => {
      const mockPdf = new File(["dummy data"], "malicious.pdf", { type: "application/pdf" });
      const mockExe = new File(["dummy data"], "script.exe", { type: "application/x-msdownload" });

      expect(() => TourVideoService.validateVideoFile(mockPdf)).toThrow(/Unsupported video format/);
      expect(() => TourVideoService.validateVideoFile(mockExe)).toThrow(/Unsupported video format/);
    });

    it("should reject oversized video files (>100MB)", () => {
      // Create a mock large file object
      const largeFile = {
        name: "huge.mp4",
        type: "video/mp4",
        size: 150 * 1024 * 1024, // 150 MB
      } as unknown as File;

      expect(() => TourVideoService.validateVideoFile(largeFile)).toThrow(/exceeds maximum limit/);
    });

    it("should generate storage directories inside storage/private/application-tours", () => {
      const dir = TourVideoService.getStorageDir();
      expect(dir).toContain("storage");
      expect(dir).toContain("private");
      expect(dir).toContain("application-tours");
    });
  });

  describe("SSRF Protection Guard", () => {
    it("should identify private and loopback IPv4 and IPv6 addresses", () => {
      expect(UrlContentExtractorService.isPrivateIp("127.0.0.1")).toBe(true);
      expect(UrlContentExtractorService.isPrivateIp("10.0.0.1")).toBe(true);
      expect(UrlContentExtractorService.isPrivateIp("192.168.1.1")).toBe(true);
      expect(UrlContentExtractorService.isPrivateIp("169.254.169.254")).toBe(true);
      expect(UrlContentExtractorService.isPrivateIp("0.0.0.0")).toBe(true);
      expect(UrlContentExtractorService.isPrivateIp("::1")).toBe(true);
      expect(UrlContentExtractorService.isPrivateIp("fe80::1")).toBe(true);
    });

    it("should allow safe public IP addresses", () => {
      expect(UrlContentExtractorService.isPrivateIp("8.8.8.8")).toBe(false);
      expect(UrlContentExtractorService.isPrivateIp("1.1.1.1")).toBe(false);
      expect(UrlContentExtractorService.isPrivateIp("142.250.190.46")).toBe(false);
    });

    it("should reject dangerous URL protocols and localhost targets", async () => {
      await expect(UrlContentExtractorService.validateUrlSafety("file:///etc/passwd")).rejects.toThrow();
      await expect(UrlContentExtractorService.validateUrlSafety("ftp://ftp.example.com")).rejects.toThrow();
      await expect(UrlContentExtractorService.validateUrlSafety("gopher://example.com")).rejects.toThrow();
      await expect(UrlContentExtractorService.validateUrlSafety("http://localhost:3000")).rejects.toThrow();
      await expect(UrlContentExtractorService.validateUrlSafety("http://127.0.0.1/admin")).rejects.toThrow();
    });
  });

  describe("Registration Role Tampering Defense", () => {
    it("should only parse allowed candidate registration fields", () => {
      const payloadWithAdmin = {
        email: "aspirant@test.com",
        fullName: "Test Aspirant",
        password: "Password@123",
        role: "SUPER_ADMIN", // Malicious injection attempt
        isAdmin: true,       // Malicious injection attempt
      };

      const parsed = registerSchema.parse(payloadWithAdmin);
      expect(parsed.email).toBe("aspirant@test.com");
      expect(parsed.fullName).toBe("Test Aspirant");
      // Schema strips or ignores unrecognized fields
      expect((parsed as any).role).toBeUndefined();
      expect((parsed as any).isAdmin).toBeUndefined();
    });
  });

  describe("Tour Video Enum Types", () => {
    it("should support both FULL_APPLICATION_TOUR and CANDIDATE_END_TOUR", () => {
      expect(TourVideoType.FULL_APPLICATION_TOUR).toBe("FULL_APPLICATION_TOUR");
      expect(TourVideoType.CANDIDATE_END_TOUR).toBe("CANDIDATE_END_TOUR");
    });
  });
});
