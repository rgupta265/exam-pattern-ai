"use client";

import { usePathname } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

export default function ForbiddenPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[70vh] relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-5 shadow-sm">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("forbidden.title")}</h1>
      <h2 className="mt-2 text-lg font-semibold text-slate-800">{t("forbidden.subtitle")}</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        {t("forbidden.description")}
      </p>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Button href={localizePath("/candidate/dashboard", locale)} variant="default">
          {t("forbidden.goToDashboard")}
        </Button>
        <Button href={localizePath("/login", locale)} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t("forbidden.switchAccount")}
        </Button>
      </div>
    </div>
  );
}
