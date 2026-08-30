import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ADMIN_NAV_ITEMS } from "@/components/layouts/admin-sidebar";
import { CANDIDATE_NAV_ITEMS } from "@/components/layouts/candidate-nav";

describe("Phase 13: Documentation, Tours & Onboarding Unit Tests", () => {
  const rootDir = process.cwd();

  describe("README.md Integrity & Coverage", () => {
    const readmePath = path.join(rootDir, "README.md");

    it("should verify that README.md exists and is non-empty", () => {
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, "utf-8");
      expect(content.length).toBeGreaterThan(1000);
    });

    it("should cover all essential setup sections in README.md", () => {
      const content = fs.readFileSync(readmePath, "utf-8");
      expect(content).toContain("Product Principle");
      expect(content).toContain("Major Capabilities");
      expect(content).toContain("Prerequisites");
      expect(content).toContain("Step-by-Step Local Setup");
      expect(content).toContain("Environment Variables Reference");
      expect(content).toContain("MySQL 8 Database Setup");
      expect(content).toContain("Prisma Setup & Migrations");
      expect(content).toContain("Local Storage Setup");
      expect(content).toContain("Google Gemini AI Configuration");
      expect(content).toContain("Route Reference Table");
      expect(content).toContain("Command Reference Table");
      expect(content).toContain("Troubleshooting Guide");
    });
  });

  describe("Application Tour Documentation Files", () => {
    it("should verify existence of standalone HTML tours", () => {
      const adminTour = path.join(rootDir, "docs", "ADMIN_APPLICATION_TOUR.html");
      const candTour = path.join(rootDir, "docs", "CANDIDATE_APPLICATION_TOUR.html");

      expect(fs.existsSync(adminTour)).toBe(true);
      expect(fs.existsSync(candTour)).toBe(true);

      const adminContent = fs.readFileSync(adminTour, "utf-8");
      const candContent = fs.readFileSync(candTour, "utf-8");

      expect(adminContent).toContain("ExamPattern AI");
      expect(adminContent).toContain("Administrator Application Tour");
      expect(candContent).toContain("Candidate Application Tour");
    });

    it("should verify existence of video walkthrough storyboards", () => {
      const adminScript = path.join(rootDir, "docs", "ADMIN_APPLICATION_TOUR_VIDEO_SCRIPT.md");
      const candScript = path.join(rootDir, "docs", "CANDIDATE_APPLICATION_TOUR_VIDEO_SCRIPT.md");

      expect(fs.existsSync(adminScript)).toBe(true);
      expect(fs.existsSync(candScript)).toBe(true);

      const adminScriptContent = fs.readFileSync(adminScript, "utf-8");
      const candScriptContent = fs.readFileSync(candScript, "utf-8");

      expect(adminScriptContent).toContain("Scene 1:");
      expect(adminScriptContent).toContain("Narration (Hindi):");
      expect(candScriptContent).toContain("Scene 1:");
      expect(candScriptContent).toContain("Narration (Hindi):");
    });
  });

  describe("Navigation & Menu Integration", () => {
    it("should include Application Tour in Admin navigation items", () => {
      const tourNav = ADMIN_NAV_ITEMS.find((item) => item.href === "/admin/application-tour");
      expect(tourNav).toBeDefined();
      expect(tourNav?.key).toBe("navigation.applicationTour");
    });

    it("should include Application Tour in Candidate navigation items", () => {
      const tourNav = CANDIDATE_NAV_ITEMS.find((item) => item.href === "/candidate/application-tour");
      expect(tourNav).toBeDefined();
      expect(tourNav?.key).toBe("navigation.applicationTour");
    });
  });
});
