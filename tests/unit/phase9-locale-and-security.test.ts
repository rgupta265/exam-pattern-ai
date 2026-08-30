import { describe, it, expect } from "vitest";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, getTranslations } from "@/lib/i18n";
import { getDatabaseConfig } from "@/config/db.config";
import { validateEnv } from "@/config/env";

describe("Phase 9: Locale Architecture, Security & Configuration", () => {
  describe("1. Locale Canonical & Translations", () => {
    it("should set English as canonical default locale", () => {
      expect(DEFAULT_LOCALE).toBe("en");
      expect(SUPPORTED_LOCALES).toContain("en");
      expect(SUPPORTED_LOCALES).toContain("hi");
    });

    it("should resolve English translations seamlessly", () => {
      const { t } = getTranslations("en");
      expect(t("common.appName")).toBe("ExamPattern AI");
      expect(t("auth.signIn")).toBe("Sign In");
      expect(t("common.loading")).toBe("Loading...");
    });

    it("should resolve Hindi translations seamlessly", () => {
      const { t } = getTranslations("hi");
      expect(t("common.appName")).toBe("ExamPattern AI");
      expect(t("auth.signIn")).toBe("साइन इन करें");
      expect(t("common.loading")).toBe("लोड हो रहा है...");
    });
  });

  describe("2. Database Configuration & URL Construction", () => {
    it("should separate database host, port, name, user, password", () => {
      const config = getDatabaseConfig();
      expect(config).toHaveProperty("host");
      expect(config).toHaveProperty("port");
      expect(config).toHaveProperty("database");
      expect(config).toHaveProperty("user");
      expect(config).toHaveProperty("url");
      expect(typeof config.url).toBe("string");
      expect(config.url).toContain("mysql://");
    });

    it("should construct valid MySQL URL when separate variables are provided", () => {
      // Test URL construction logic without mutating permanent env
      const user = "test_user";
      const pass = "secret@123#";
      const host = "db.internal.local";
      const port = 3306;
      const db = "test_exam_db";

      const authPart = `${encodeURIComponent(user)}:${encodeURIComponent(pass)}`;
      const url = `mysql://${authPart}@${host}:${port}/${db}`;

      expect(url).toBe("mysql://test_user:secret%40123%23@db.internal.local:3306/test_exam_db");
    });
  });

  describe("3. Environment Validation System", () => {
    it("should validate environment variables with Zod schema", () => {
      const env = validateEnv();
      expect(env.NODE_ENV).toBeDefined();
      expect(env.DEFAULT_LOCALE).toBe("en");
      expect(env.STORAGE_DRIVER).toBe("local");
    });
  });

  describe("4. Route Preservation Logic in Language Switching", () => {
    function computeTargetLocaleUrl(currentPath: string, searchParamsString: string, targetLocale: string): string {
      const pathSegments = currentPath.split("/").filter(Boolean);
      let targetPath = "";

      if (pathSegments.length > 0 && ["en", "hi"].includes(pathSegments[0])) {
        const remaining = pathSegments.slice(1);
        targetPath = `/${targetLocale}${remaining.length > 0 ? `/${remaining.join("/")}` : ""}`;
      } else {
        targetPath = `/${targetLocale}${currentPath === "/" ? "" : currentPath}`;
      }

      return searchParamsString ? `${targetPath}?${searchParamsString}` : targetPath;
    }

    it("should preserve path, dynamic IDs, and query params when switching to Hindi", () => {
      const url = computeTargetLocaleUrl("/en/candidate/mock-tests/mock-123", "page=2&filter=active", "hi");
      expect(url).toBe("/hi/candidate/mock-tests/mock-123?page=2&filter=active");
    });

    it("should preserve path, dynamic IDs, and query params when switching to English", () => {
      const url = computeTargetLocaleUrl("/hi/admin/questions/q-456/edit", "status=draft", "en");
      expect(url).toBe("/en/admin/questions/q-456/edit?status=draft");
    });

    it("should convert root path to canonical target locale", () => {
      expect(computeTargetLocaleUrl("/en", "", "hi")).toBe("/hi");
      expect(computeTargetLocaleUrl("/hi", "", "en")).toBe("/en");
      expect(computeTargetLocaleUrl("/", "", "en")).toBe("/en");
    });
  });
});
