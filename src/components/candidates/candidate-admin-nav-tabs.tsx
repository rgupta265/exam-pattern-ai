"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, BookOpen, Award, TrendingUp, Activity } from "lucide-react";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

export function CandidateAdminNavTabs({ candidateId }: { candidateId: string }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  const tabs = [
    { name: t("candidateAdminTabs.overview", "Candidate Overview"), href: `/admin/candidates/${candidateId}`, exact: true, icon: User },
    { name: t("candidateAdminTabs.attemptsLog", "Attempts Log"), href: `/admin/candidates/${candidateId}/attempts`, exact: false, icon: BookOpen },
    { name: t("candidateAdminTabs.scorecards", "Scorecards"), href: `/admin/candidates/${candidateId}/results`, exact: false, icon: Award },
    { name: t("candidateAdminTabs.diagnostics", "Performance Diagnostics"), href: `/admin/candidates/${candidateId}/performance`, exact: false, icon: TrendingUp },
    { name: t("candidateAdminTabs.activityStream", "Real-Time Activity Stream"), href: `/admin/candidates/${candidateId}/activity`, exact: false, icon: Activity },
  ];

  return (
    <nav className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs sm:text-sm font-semibold">
      {tabs.map((tab) => {
        const localizedHref = localizePath(tab.href, locale);
        const isActive = tab.exact
          ? pathname === localizedHref || pathname === tab.href
          : pathname.startsWith(localizedHref) || pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={localizedHref}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap min-h-[38px] transition-all ${
              isActive
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
