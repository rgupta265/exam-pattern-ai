"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, HelpCircle, BarChart3, Target, Clock } from "lucide-react";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

export function ResultNavTabs({ resultId }: { resultId: string }) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  const tabs = [
    { name: t("resultTabs.scorecardOverview", "Scorecard Overview"), href: `/candidate/results/${resultId}`, exact: true, icon: Award },
    { name: t("resultTabs.detailedQuestions", "Detailed Questions"), href: `/candidate/results/${resultId}/questions`, exact: false, icon: HelpCircle },
    { name: t("resultTabs.sectionAnalysis", "Section Analysis"), href: `/candidate/results/${resultId}/analysis`, exact: false, icon: BarChart3 },
    { name: t("resultTabs.topicBreakdown", "Topic Breakdown"), href: `/candidate/results/${resultId}/topics`, exact: false, icon: Target },
    { name: t("resultTabs.timeAnalysis", "Time Analysis"), href: `/candidate/results/${resultId}/time-analysis`, exact: false, icon: Clock },
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
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg whitespace-nowrap min-h-[40px] transition-all ${
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
