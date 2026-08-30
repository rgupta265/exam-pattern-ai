import { describe, it, expect } from "vitest";
import { getTranslations, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";

describe("Locale Routing & Localization Test", () => {
  it("should support both English and Hindi locales", () => {
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("hi");
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("should retrieve English translations for Phase 8 keys", () => {
    const { t } = getTranslations("en");

    expect(t("practice.title")).toBe("Candidate Practice Generator");
    expect(t("mock.generateActualPattern")).toBe("Generate Actual Pattern Mock");
    expect(t("mock.patternCompliant")).toBe("100% Pattern Compliant");
    expect(t("documents.readinessChecklist")).toBe("Document Readiness Checklist");
  });

  it("should retrieve Hindi translations for Phase 8 keys", () => {
    const { t } = getTranslations("hi");

    expect(t("practice.title")).toBe("अभ्यर्थी अभ्यास जनरेटर");
    expect(t("mock.generateActualPattern")).toBe("वास्तविक पैटर्न मॉक जनरेट करें");
    expect(t("mock.patternCompliant")).toBe("100% पैटर्न अनुपालन");
    expect(t("documents.readinessChecklist")).toBe("दस्तावेज़ तत्परता चेकलिस्ट");
  });
});
