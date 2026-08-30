import { notFound } from "next/navigation";
import Link from "next/link";
import { ResultService } from "@/services/result/result.service";
import { CandidateAdminNavTabs } from "@/components/candidates/candidate-admin-nav-tabs";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminCandidatePerformancePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  let perf;
  try {
    perf = await ResultService.getCandidatePerformance(candidateId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href={`/admin/candidates/${candidateId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to Candidate Profile
          </Button>
        </Link>
      </div>

      <CandidateAdminNavTabs candidateId={candidateId} />

      {/* Aggregate KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Total Tests</span>
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

      {/* Diagnostic Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> Topic Strengths (≥75%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {perf.strongTopics.length === 0 ? (
              <p className="text-slate-500 italic">No strong topics recorded yet.</p>
            ) : (
              perf.strongTopics.map((t) => (
                <div key={t.id} className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.topic.name}</span>
                  <span className="font-bold text-emerald-700">{Number(t.accuracyRate).toFixed(0)}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-red-950 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" /> Weak Areas (&lt;50%)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {perf.weakTopics.length === 0 ? (
              <p className="text-slate-500 italic">No critical weak areas recorded.</p>
            ) : (
              perf.weakTopics.map((t) => (
                <div key={t.id} className="p-2.5 bg-red-50/50 rounded-lg border border-red-200 flex items-center justify-between">
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
