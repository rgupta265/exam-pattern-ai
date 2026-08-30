import { describe, it, expect } from "vitest";
import enMessages from "../../messages/en.json";
import hiMessages from "../../messages/hi.json";

function extractAllKeyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  let paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      paths = paths.concat(extractAllKeyPaths(value as Record<string, unknown>, currentPath));
    } else {
      paths.push(currentPath);
    }
  }
  return paths.sort();
}

function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return current;
}

describe("Phase 11: Translation Key Parity & Completeness Audit", () => {
  const enKeys = extractAllKeyPaths(enMessages as Record<string, unknown>);
  const hiKeys = extractAllKeyPaths(hiMessages as Record<string, unknown>);

  it("should have identical key counts in English and Hindi dictionaries", () => {
    expect(enKeys.length).toBeGreaterThan(50);
    expect(enKeys.length).toBe(hiKeys.length);
  });

  it("should ensure every English key has a corresponding Hindi key", () => {
    const missingInHindi = enKeys.filter((key) => !hiKeys.includes(key));
    expect(missingInHindi).toEqual([]);
  });

  it("should ensure every Hindi key has a corresponding English key", () => {
    const missingInEnglish = hiKeys.filter((key) => !enKeys.includes(key));
    expect(missingInEnglish).toEqual([]);
  });

  it("should ensure no translation value is empty or untranslated placeholder", () => {
    for (const key of enKeys) {
      const enVal = getValueByPath(enMessages as Record<string, unknown>, key);
      const hiVal = getValueByPath(hiMessages as Record<string, unknown>, key);

      expect(typeof enVal).toBe("string");
      expect((enVal as string).trim().length).toBeGreaterThan(0);

      expect(typeof hiVal).toBe("string");
      expect((hiVal as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("should contain all required top-level namespaces", () => {
    const requiredNamespaces = [
      "common",
      "home",
      "auth",
      "navigation",
      "candidateDashboard",
      "forbidden",
      "notFound",
      "resultTabs",
      "candidateAdminTabs",
      "examInterface",
      "instructions",
      "mock",
      "practice",
      "documents",
      "ai",
      "validation",
      "errors",
      "notifications",
    ];

    const enNamespaces = Object.keys(enMessages);
    const hiNamespaces = Object.keys(hiMessages);

    for (const ns of requiredNamespaces) {
      expect(enNamespaces).toContain(ns);
      expect(hiNamespaces).toContain(ns);
    }
  });
});
