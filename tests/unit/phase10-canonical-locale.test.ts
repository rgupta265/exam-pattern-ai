import { describe, it, expect } from "vitest";
import {
  getLocaleFromPath,
  localizePath,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getTranslations,
} from "@/lib/i18n";

describe("Phase 10: Canonical Locale Routing & Navigation Helper Tests", () => {
  it("should have 'en' as default locale and support 'en' and 'hi'", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("hi");
    expect(SUPPORTED_LOCALES.length).toBe(2);
  });

  describe("getLocaleFromPath", () => {
    it("should extract 'en' from /en path", () => {
      expect(getLocaleFromPath("/en")).toBe("en");
      expect(getLocaleFromPath("/en/login")).toBe("en");
      expect(getLocaleFromPath("/en/candidate/dashboard")).toBe("en");
    });

    it("should extract 'hi' from /hi path", () => {
      expect(getLocaleFromPath("/hi")).toBe("hi");
      expect(getLocaleFromPath("/hi/login")).toBe("hi");
      expect(getLocaleFromPath("/hi/candidate/dashboard")).toBe("hi");
    });

    it("should return default locale 'en' for locale-less or empty paths", () => {
      expect(getLocaleFromPath("/")).toBe("en");
      expect(getLocaleFromPath("/login")).toBe("en");
      expect(getLocaleFromPath("/candidate/dashboard")).toBe("en");
      expect(getLocaleFromPath("")).toBe("en");
      expect(getLocaleFromPath(null)).toBe("en");
      expect(getLocaleFromPath(undefined)).toBe("en");
    });

    it("should return default locale 'en' for unsupported locale prefixes", () => {
      expect(getLocaleFromPath("/fr/login")).toBe("en");
      expect(getLocaleFromPath("/es/dashboard")).toBe("en");
    });
  });

  describe("localizePath", () => {
    it("should localize root '/' to '/en' or '/hi'", () => {
      expect(localizePath("/", "en")).toBe("/en");
      expect(localizePath("/", "hi")).toBe("/hi");
    });

    it("should localize locale-less routes to active locale prefix", () => {
      expect(localizePath("/login", "en")).toBe("/en/login");
      expect(localizePath("/login", "hi")).toBe("/hi/login");
      expect(localizePath("/candidate/dashboard", "en")).toBe("/en/candidate/dashboard");
      expect(localizePath("/candidate/dashboard", "hi")).toBe("/hi/candidate/dashboard");
      expect(localizePath("/admin/questions", "en")).toBe("/en/admin/questions");
      expect(localizePath("/admin/questions", "hi")).toBe("/hi/admin/questions");
    });

    it("should switch locale for already localized paths", () => {
      expect(localizePath("/en/candidate/dashboard", "hi")).toBe("/hi/candidate/dashboard");
      expect(localizePath("/hi/candidate/dashboard", "en")).toBe("/en/candidate/dashboard");
      expect(localizePath("/en/login", "hi")).toBe("/hi/login");
      expect(localizePath("/hi/login", "en")).toBe("/en/login");
    });

    it("should preserve dynamic route IDs when switching locales", () => {
      const mockId = "d3647cba-c335-4ab3-8094-bcf39fb144b5";
      expect(localizePath(`/en/candidate/mock-tests/${mockId}`, "hi")).toBe(
        `/hi/candidate/mock-tests/${mockId}`
      );
      expect(localizePath(`/hi/candidate/mock-tests/${mockId}`, "en")).toBe(
        `/en/candidate/mock-tests/${mockId}`
      );
    });

    it("should preserve query parameters when switching or applying locale", () => {
      expect(localizePath("/admin/questions?exam=123&page=2", "hi")).toBe(
        "/hi/admin/questions?exam=123&page=2"
      );
      expect(localizePath("/en/admin/questions?exam=123&status=published&page=2", "hi")).toBe(
        "/hi/admin/questions?exam=123&status=published&page=2"
      );
    });

    it("should preserve hash anchors when switching or applying locale", () => {
      expect(localizePath("/about#faq", "en")).toBe("/en/about#faq");
      expect(localizePath("/en/about#faq", "hi")).toBe("/hi/about#faq");
      expect(localizePath("/candidate/mock-tests?filter=all#results", "hi")).toBe(
        "/hi/candidate/mock-tests?filter=all#results"
      );
    });

    it("should not modify external URLs, mailto, tel, or pure hashes", () => {
      expect(localizePath("https://google.com", "hi")).toBe("https://google.com");
      expect(localizePath("http://exampattern.ai", "en")).toBe("http://exampattern.ai");
      expect(localizePath("mailto:test@example.com", "hi")).toBe("mailto:test@example.com");
      expect(localizePath("tel:+919876543210", "en")).toBe("tel:+919876543210");
      expect(localizePath("#section-1", "hi")).toBe("#section-1");
    });
  });

  describe("Translations integrity across locales", () => {
    it("should provide consistent keys between English and Hindi dictionaries", () => {
      const en = getTranslations("en");
      const hi = getTranslations("hi");

      expect(en.t("common.appName")).toBe("ExamPattern AI");
      expect(hi.t("common.appName")).toBe("ExamPattern AI");

      expect(en.t("auth.signIn")).toBe("Sign In");
      expect(hi.t("auth.signIn")).toBe("साइन इन करें");

      expect(en.t("navigation.dashboard")).toBe("Dashboard");
      expect(hi.t("navigation.dashboard")).toBe("डैशबोर्ड");

      expect(en.t("navigation.mockTests")).toBe("Mock Tests");
      expect(hi.t("navigation.mockTests")).toBe("मॉक टेस्ट");
    });
  });
});
