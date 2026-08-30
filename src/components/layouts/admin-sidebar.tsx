"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  Bell,
  FileSpreadsheet,
  HelpCircle,
  CheckSquare,
  FileCheck,
  Users,
  BarChart3,
  History,
  Settings,
  Layers,
  Compass,
  Database,
  X,
} from "lucide-react";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", key: "navigation.dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/exam-categories", key: "navigation.examCategories", defaultLabel: "Exam Categories", icon: Layers },
  { href: "/admin/exams", key: "navigation.exams", defaultLabel: "Exams & Versions", icon: GraduationCap },
  { href: "/admin/notifications", key: "navigation.notifications", defaultLabel: "Official Notifications", icon: Bell },
  { href: "/admin/blueprints", key: "navigation.blueprints", defaultLabel: "Exam Blueprints", icon: FileSpreadsheet },
  { href: "/admin/questions", key: "navigation.questions", defaultLabel: "Question Bank", icon: HelpCircle },
  { href: "/admin/question-reviews", key: "navigation.questionReviews", defaultLabel: "Question Reviews", icon: CheckSquare },
  { href: "/admin/mock-tests", key: "navigation.mockTests", defaultLabel: "Mock Tests", icon: FileCheck },
  { href: "/admin/candidates", key: "navigation.candidates", defaultLabel: "Candidates & Attempts", icon: Users },
  { href: "/admin/reports", key: "navigation.reports", defaultLabel: "Analytics & Reports", icon: BarChart3 },
  { href: "/admin/database", key: "navigation.database", defaultLabel: "Database Management", icon: Database },
  { href: "/admin/audit-logs", key: "navigation.auditLogs", defaultLabel: "Audit Logs", icon: History },
  { href: "/admin/settings", key: "navigation.settings", defaultLabel: "System Settings", icon: Settings },
  { href: "/admin/application-tour", key: "navigation.applicationTour", defaultLabel: "Application Tour", icon: Compass },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  const content = (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-1 px-3">
        <div className="flex items-center justify-between px-3 py-2 md:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("navigation.adminMenu")}
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
          {ADMIN_NAV_ITEMS.map((item) => {
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

      <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
        <p className="font-semibold text-slate-600">ExamPattern AI Engine</p>
        <p>Verified Pattern Precision</p>
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
