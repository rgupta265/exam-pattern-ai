"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    // 1. Check pathname prefix
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0 && SUPPORTED_LOCALES.includes(pathSegments[0] as Locale)) {
      setCurrentLocale(pathSegments[0] as Locale);
      return;
    }

    // 2. Check cookie
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1] as Locale | undefined;

    if (saved && SUPPORTED_LOCALES.includes(saved)) {
      setCurrentLocale(saved);
    }
  }, [pathname]);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    setCurrentLocale(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Construct target URL preserving current path, dynamic IDs, and all query params
    const pathSegments = pathname.split("/").filter(Boolean);
    let targetPath = "";

    if (pathSegments.length > 0 && SUPPORTED_LOCALES.includes(pathSegments[0] as Locale)) {
      const remaining = pathSegments.slice(1);
      targetPath = `/${newLocale}${remaining.length > 0 ? `/${remaining.join("/")}` : ""}`;
    } else {
      targetPath = `/${newLocale}${pathname === "/" ? "" : pathname}`;
    }

    const queryString = searchParams?.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const pathWithQuery = queryString ? `${targetPath}?${queryString}` : targetPath;
    const finalUrl = `${pathWithQuery}${hash}`;

    // Use Next.js App Router client-side navigation without full browser reload
    router.replace(finalUrl);
    router.refresh();
  };

  const activeLocale = isMounted ? currentLocale : "en";

  return (
    <div
      role="group"
      aria-label="Select language / भाषा चुनें"
      suppressHydrationWarning
      className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold shrink-0"
    >
      <Globe className="h-3.5 w-3.5 text-slate-500 mx-1 shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        aria-pressed={activeLocale === "en"}
        aria-label="Switch to English"
        suppressHydrationWarning
        className={`px-2.5 py-1 rounded-lg transition-all min-h-[34px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          activeLocale === "en"
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange("hi")}
        aria-pressed={activeLocale === "hi"}
        aria-label="हिंदी में बदलें"
        suppressHydrationWarning
        className={`px-2.5 py-1 rounded-lg transition-all min-h-[34px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          activeLocale === "hi"
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}
