"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  FileCheck,
  Sparkles,
  Award,
  TrendingUp,
  User,
  Settings,
  Compass,
  X,
} from "lucide-react";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

interface CandidateNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CANDIDATE_NAV_ITEMS = [
  { href: "/candidate/dashboard", key: "navigation.dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/candidate/exams", key: "navigation.exploreExams", defaultLabel: "Explore Exams", icon: GraduationCap },
  { href: "/candidate/mock-tests", key: "navigation.mockTests", defaultLabel: "Mock Tests", icon: FileCheck },
  { href: "/candidate/practice", key: "navigation.practice", defaultLabel: "Practice Drills", icon: Sparkles },
  { href: "/candidate/results", key: "navigation.results", defaultLabel: "Test Results", icon: Award },
  { href: "/candidate/performance", key: "navigation.performance", defaultLabel: "Performance & Analytics", icon: TrendingUp },
  { href: "/candidate/profile", key: "navigation.profile", defaultLabel: "My Profile", icon: User },
  { href: "/candidate/settings", key: "navigation.settings", defaultLabel: "Account Settings", icon: Settings },
  { href: "/candidate/application-tour", key: "navigation.applicationTour", defaultLabel: "Application Tour", icon: Compass },
];

export function CandidateNav({ isOpen, onClose }: CandidateNavProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  const content = (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-1 px-3">
        <div className="flex items-center justify-between px-3 py-2 md:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("navigation.candidatePortal")}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <nav className="space-y-1">
          {CANDIDATE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const localizedHref = localizePath(item.href, locale);
            const label = t(item.key, item.defaultLabel);
            const isActive =
              pathname === localizedHref ||
              pathname.startsWith(`${localizedHref}/`) ||
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={localizedHref}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-400")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 py-3 bg-blue-50/60 rounded-xl mx-3 border border-blue-100">
        <p className="text-xs font-semibold text-blue-900">ExamPattern AI Engine</p>
        <p className="text-xs text-blue-700 mt-0.5">{t("mock.patternCompliant")}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-slate-200 bg-white sticky top-16 shrink-0 overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative flex w-72 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
