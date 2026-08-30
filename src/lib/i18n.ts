import enMessages from "../../messages/en.json";
import hiMessages from "../../messages/hi.json";

export type Locale = "en" | "hi";
export const SUPPORTED_LOCALES: Locale[] = ["en", "hi"];
export const DEFAULT_LOCALE: Locale = "en";

const messages: Record<Locale, Record<string, unknown>> = {
  en: enMessages as Record<string, unknown>,
  hi: hiMessages as Record<string, unknown>,
};

export function getTranslations(locale: Locale = DEFAULT_LOCALE) {
  const dict = messages[locale] || messages[DEFAULT_LOCALE];

  return {
    locale,
    t: (
      path: string,
      paramsOrFallback?: Record<string, string | number> | string,
      fallback?: string
    ): string => {
      const keys = path.split(".");
      let current: unknown = dict;

      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = (current as Record<string, unknown>)[k];
        } else {
          current = undefined;
          break;
        }
      }

      let res =
        typeof current === "string"
          ? current
          : typeof paramsOrFallback === "string"
          ? paramsOrFallback
          : fallback || path;

      if (paramsOrFallback && typeof paramsOrFallback === "object") {
        for (const [key, value] of Object.entries(paramsOrFallback)) {
          res = res.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
        }
      }

      return res;
    },
  };
}

export function getLocaleFromPath(pathname?: string | null): Locale {
  if (!pathname) return DEFAULT_LOCALE;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as Locale)) {
    return segments[0] as Locale;
  }
  return DEFAULT_LOCALE;
}

export function localizePath(path: string, locale: Locale = DEFAULT_LOCALE): string {
  if (
    !path ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    path.startsWith("#")
  ) {
    return path;
  }

  // Preserve query string and hash
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  let suffix = "";

  const qIndex = cleanPath.indexOf("?");
  const hIndex = cleanPath.indexOf("#");

  let cutIndex = -1;
  if (qIndex !== -1 && hIndex !== -1) {
    cutIndex = Math.min(qIndex, hIndex);
  } else if (qIndex !== -1) {
    cutIndex = qIndex;
  } else if (hIndex !== -1) {
    cutIndex = hIndex;
  }

  if (cutIndex !== -1) {
    suffix = cleanPath.slice(cutIndex);
    cleanPath = cleanPath.slice(0, cutIndex);
  }

  const segments = cleanPath.split("/").filter(Boolean);

  if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as Locale)) {
    const remaining = segments.slice(1);
    const target = remaining.length > 0 ? `/${remaining.join("/")}` : "";
    return `/${locale}${target}${suffix}`;
  }

  if (cleanPath === "/") {
    return `/${locale}${suffix}`;
  }

  return `/${locale}${cleanPath}${suffix}`;
}
