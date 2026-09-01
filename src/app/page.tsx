import Link from "next/link";
import { headers } from "next/headers";
import { BookOpen, ShieldCheck, Cpu, ArrowRight, CheckCircle2, Compass, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { DigitalClock } from "@/components/common/digital-clock";
import { Locale, getTranslations, localizePath } from "@/lib/i18n";
import { getServerSession } from "@/lib/auth";

export default async function HomePage() {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || "en") as Locale;
  const { t } = getTranslations(locale);

  // Determine authenticated session server-side (Zero Client Trust)
  const session = await getServerSession();
  const isAdmin = session ? session.roles.some((r) => r === "SUPER_ADMIN" || r === "ADMIN") : false;
  const isCandidate = session ? session.roles.includes("CANDIDATE") : false;

  const dashboardUrl = isAdmin ? "/admin/dashboard" : "/candidate/dashboard";
  const dashboardLabel = isAdmin ? t("home.goToAdminDashboard") : t("home.goToCandidateDashboard");
  const tourUrl = isAdmin ? "/admin/application-tour" : "/candidate/application-tour";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-8 backdrop-blur">
        <Link href={localizePath("/", locale)} className="flex items-center gap-2.5 font-bold text-slate-900 text-lg md:text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <span>{t("common.appName")}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {session ? (
            <>
              <Link href={localizePath(dashboardUrl, locale)}>
                <Button size="sm" className="font-semibold min-h-[36px] flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("navigation.dashboard")}</span>
                </Button>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <Button variant="ghost" size="sm" type="submit" className="font-semibold text-slate-600 min-h-[36px] flex items-center gap-1">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("auth.signOut")}</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href={localizePath("/login", locale)}>
                <Button variant="ghost" size="sm" className="font-semibold text-slate-700 min-h-[36px]">
                  {t("auth.signIn")}
                </Button>
              </Link>
              <Link href={localizePath("/register", locale)}>
                <Button size="sm" className="font-semibold min-h-[36px]">
                  {t("home.startPractice")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-4 py-12 md:py-24 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs md:text-sm font-semibold mb-6">
            <ShieldCheck className="h-4 w-4" />
            {t("home.badge")}
          </div>

          {session && (
            <div className="mb-4 inline-block px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              {t("home.welcomeBackUser").replace("{name}", session.fullName || session.email)}
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t("home.heroTitlePrefix")} <span className="text-blue-600">{t("home.heroTitleHighlight")}</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            {t("home.heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            {session ? (
              <>
                <Link href={localizePath(dashboardUrl, locale)} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-semibold shadow-md min-h-[44px]">
                    <LayoutDashboard className="h-5 w-5" />
                    {dashboardLabel} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {isCandidate && (
                  <Link href={localizePath("/candidate/mock-tests", locale)} className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-base min-h-[44px]">
                      {t("home.exploreMocks")}
                    </Button>
                  </Link>
                )}
                <Link href={localizePath(tourUrl, locale)} className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base text-slate-700 min-h-[44px] flex items-center justify-center gap-2">
                    <Compass className="h-4 w-4" />
                    {t("navigation.applicationTour")}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href={localizePath("/register", locale)} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-semibold shadow-md min-h-[44px]">
                    {t("home.startPractice")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={localizePath("/login", locale)} className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base min-h-[44px]">
                    {t("home.candidateLogin")}
                  </Button>
                </Link>
                <Link href={localizePath("/admin/dashboard", locale)} className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base text-slate-700 min-h-[44px]">
                    {t("home.adminConsole")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Core Feature Pillars */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t("home.feature1Title")}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {t("home.feature1Desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t("home.feature2Title")}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {t("home.feature2Desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 md:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{t("home.feature3Title")}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {t("home.feature3Desc")}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <DigitalClock />
          <p>{t("home.footerText")}</p>
        </div>
      </footer>
    </div>
  );
}
