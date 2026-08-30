import { getServerSession } from "@/lib/auth";
import Link from "next/link";
import { ResultService } from "@/services/result/result.service";
import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CandidatePerformancePage() {
  const session = await getServerSession();

  if (!session) {
    return (
      <div className="p-12 text-center text-slate-500">
        Please <Link href="/login" className="text-blue-600 underline">login</Link> to view your performance dashboard.
      </div>
    );
  }

  const perf = await ResultService.getCandidatePerformance(session.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Longitudinal Performance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your overall score progression, diagnostic topic strengths, and exam preparedness.
        </p>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Tests Attempted</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{perf.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Average Score</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{perf.averageScore.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Best Score</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{perf.bestScore.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Overall Accuracy</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">{perf.averageAccuracy.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Score Trends */}
      {perf.scoreTrends.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" /> Recent Mock Test Score Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {perf.scoreTrends.map((t) => (
                <div
                  key={t.index}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                      #{t.index}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{t.title}</span>
                      <span className="text-slate-400 text-[11px]">{formatDate(t.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-purple-700">{t.accuracy.toFixed(0)}% Accuracy</span>
                    <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      Score: {t.score.toFixed(1)} / {t.totalMarks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strong & Weak Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strong Topics */}
        <Card className="shadow-sm border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> Strengths (Accuracy ≥75%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {perf.strongTopics.length === 0 ? (
              <p className="text-slate-500 italic">Continue practicing to identify strong topics.</p>
            ) : (
              perf.strongTopics.map((t) => (
                <div key={t.id} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.topic.name}</span>
                  <span className="font-bold text-emerald-700">{Number(t.accuracyRate).toFixed(0)}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weak Topics */}
        <Card className="shadow-sm border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-red-950 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" /> Target Areas for Revision (&lt;50%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {perf.weakTopics.length === 0 ? (
              <p className="text-slate-500 italic">No critical weak topics identified.</p>
            ) : (
              perf.weakTopics.map((t) => (
                <div key={t.id} className="p-3 bg-red-50/50 rounded-lg border border-red-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.topic.name}</span>
                  <span className="font-bold text-red-700">{Number(t.accuracyRate).toFixed(0)}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
