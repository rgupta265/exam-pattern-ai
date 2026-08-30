import Link from "next/link";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth";
import { ResultService } from "@/services/result/result.service";
import { ExamService } from "@/services/exam/exam.service";
import { BookOpen, Award, TrendingUp, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Locale, getTranslations, localizePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CandidateDashboardPage() {
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || "en") as Locale;
  const { t } = getTranslations(locale);

  const session = await getServerSession();

  const [perf, examsResult] = await Promise.all([
    session ? ResultService.getCandidatePerformance(session.id) : null,
    ExamService.getExams({ isCandidateFacing: true, page: 1, pageSize: 5 }),
  ]);

  const attemptsCount = perf?.totalAttempts || 0;
  const avgScore = perf?.averageScore || 0;
  const bestScore = perf?.bestScore || 0;
  const avgAcc = perf?.averageAccuracy || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 md:p-8 text-white shadow-sm">
        <div className="max-w-2xl">
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-3">
            {t("candidateDashboard.portalBadge")}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("candidateDashboard.welcome")}{session?.fullName ? `, ${session.fullName}` : ""}!
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            {t("candidateDashboard.subheading")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={localizePath("/candidate/mock-tests", locale)} variant="secondary" className="font-semibold text-blue-900 min-h-[44px]">
              <Zap className="mr-1.5 h-4 w-4" /> {t("candidateDashboard.startMock")}
            </Button>
            <Button href={localizePath("/candidate/performance", locale)} variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 min-h-[44px]">
              {t("candidateDashboard.viewAnalytics")}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">{t("candidateDashboard.mocksAttempted")}</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{attemptsCount}</div>
            <p className="text-xs text-slate-500 mt-1">{t("candidateDashboard.totalCompletedTests")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">{t("candidateDashboard.averageScore")}</CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {attemptsCount > 0 ? avgScore.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("candidateDashboard.netAggregateMarks")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">{t("candidateDashboard.bestScore")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {attemptsCount > 0 ? bestScore.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("candidateDashboard.highestAchieved")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">{t("candidateDashboard.overallAccuracy")}</CardTitle>
            <Target className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {attemptsCount > 0 ? `${avgAcc.toFixed(1)}%` : "—"}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("candidateDashboard.accuracyBenchmark")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scorecards and Recommended Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Test History */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">{t("candidateDashboard.recentScorecards")}</CardTitle>
            <Link href={localizePath("/candidate/results", locale)} className="text-xs font-semibold text-blue-600 hover:underline">
              {t("candidateDashboard.viewAll")}
            </Link>
          </CardHeader>
          <CardContent>
            {!perf?.recentResults || perf.recentResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {t("candidateDashboard.noEvaluations")}
              </div>
            ) : (
              <div className="space-y-2.5">
                {perf.recentResults.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href={localizePath(`/candidate/results/${r.id}`, locale)}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-blue-300 transition-all block"
                  >
                    <div>
                      <strong className="font-bold text-slate-900 block">{r.attempt.mockTest.title}</strong>
                      <span className="text-slate-400 text-[11px]">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-700 block">
                        {Number(r.netScore).toFixed(1)} / {Number(r.totalMarks)}
                      </span>
                      <span className="text-slate-500 text-[11px]">{Number(r.accuracyRate).toFixed(0)}% {t("mock.accuracy")}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verified Target Exams */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">{t("candidateDashboard.availableExams")}</CardTitle>
            <Link href={localizePath("/candidate/exams", locale)} className="text-xs font-semibold text-blue-600 hover:underline">
              {t("candidateDashboard.browseCatalog")}
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {examsResult.items.map((exam) => (
                <div
                  key={exam.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="font-bold text-slate-900 block">{exam.name}</strong>
                    <span className="text-slate-500 text-[11px]">{exam.authority} • {exam.category?.name}</span>
                  </div>
                  <Button href={localizePath(`/candidate/exams/${exam.id}`, locale)} size="sm" variant="outline" className="text-xs font-semibold min-h-[36px]">
                    {t("candidateDashboard.viewDetails")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
