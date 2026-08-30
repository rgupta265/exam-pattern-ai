"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HelpCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

export default function NotFound() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh] relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 mb-5">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t("notFound.title")}</h1>
      <h2 className="mt-2 text-xl font-semibold text-slate-800">{t("notFound.subtitle")}</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        {t("notFound.description")}
      </p>
      <div className="mt-6">
        <Link href={localizePath("/", locale)}>
          <Button className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            {t("notFound.returnHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
