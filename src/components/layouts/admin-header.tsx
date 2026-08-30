"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Shield, LogOut, User as UserIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

interface AdminHeaderProps {
  userEmail?: string;
  userName?: string;
  onToggleSidebar?: () => void;
}

export function AdminHeader({ userEmail, userName, onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(localizePath("/login", locale));
      router.refresh();
    } catch {
      router.push(localizePath("/login", locale));
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px]"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        <Link href={localizePath("/admin/dashboard", locale)} className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">{t("common.appName")}</span>
          <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-400">
            {t("navigation.admin")}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <UserIcon className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-800 dark:text-slate-200">{userName || t("navigation.admin")}</span>
          {userEmail && <span className="text-xs text-slate-400">({userEmail})</span>}
        </div>

        {/* Language Switcher immediately before Logout */}
        <LanguageSwitcher />

        {/* Logout Section */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 min-h-[36px]"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden xs:inline">{t("navigation.logout")}</span>
        </Button>
      </div>
    </header>
  );
}
