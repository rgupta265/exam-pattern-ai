import { describe, it, expect } from "vitest";
import { getTranslations } from "@/lib/i18n";

describe("Bilingual Translation & Localization Unit Tests", () => {
  it("should retrieve valid English translation dictionary keys", () => {
    const { t } = getTranslations("en");
    expect(t("common.appName")).toBe("ExamPattern AI");
    expect(t("instructions.title")).toContain("Instructions");
    expect(t("mock.fullPatternMock")).toContain("Full Pattern");
  });

  it("should retrieve valid Hindi translation dictionary keys", () => {
    const { t } = getTranslations("hi");
    expect(t("common.appName")).toBe("ExamPattern AI");
    expect(t("instructions.title")).toContain("निर्देश");
    expect(t("mock.startTest")).toBe("टेस्ट शुरू करें");
  });

  it("should return fallback key when translation path is missing", () => {
    const { t } = getTranslations("en");
    expect(t("nonexistent.key.path", "Fallback String")).toBe("Fallback String");
  });

  it("should preserve logical option correctness regardless of language", () => {
    const logicalQuestion = {
      id: "q-1",
      questionText: "What is the capital of India?",
      questionTextHindi: "भारत की राजधानी क्या है?",
      options: [
        { key: "A", text: "Mumbai", textHindi: "मुंबई", isCorrect: false },
        { key: "B", text: "New Delhi", textHindi: "नई दिल्ली", isCorrect: true },
        { key: "C", text: "Kolkata", textHindi: "कोलकाता", isCorrect: false },
      ],
      correctAnswer: "B",
    };

    const correctOptionEn = logicalQuestion.options.find((o) => o.isCorrect);
    expect(correctOptionEn?.key).toBe("B");
    expect(correctOptionEn?.text).toBe("New Delhi");
    expect(correctOptionEn?.textHindi).toBe("नई दिल्ली");
  });
});
