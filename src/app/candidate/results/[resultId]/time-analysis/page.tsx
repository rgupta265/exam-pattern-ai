import { notFound } from "next/navigation";
import { ResultService } from "@/services/result/result.service";
import { getServerSession } from "@/lib/auth";
import { ResultNavTabs } from "@/components/results/result-nav-tabs";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CandidateResultTimeAnalysisPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const session = await getServerSession();
  const { resultId } = await params;

  if (!session) return notFound();

  let result;
  try {
    result = await ResultService.getResultById(resultId, session.id);
  } catch {
    notFound();
  }

  const totalTimeSeconds = result.attempt.totalTimeSpentSeconds || 0;
  const totalMins = Math.floor(totalTimeSeconds / 60);
  const totalSecs = totalTimeSeconds % 60;

  const avgTimePerQuestion =
    result.attemptedQuestions > 0
      ? Math.round(totalTimeSeconds / result.attemptedQuestions)
      : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button href={`/candidate/results/${resultId}`} variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> Back to Scorecard
        </Button>
      </div>

      <ResultNavTabs resultId={resultId} />

      {/* Time Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Total Time Spent</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalMins}m {totalSecs}s
            </div>
            <span className="text-[11px] text-slate-500">Allowed: {result.attempt.mockTest.durationMinutes} mins</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Average Time / Question</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{avgTimePerQuestion}s</div>
            <span className="text-[11px] text-blue-700">Across {result.attemptedQuestions} attempted items</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Time Efficiency Rating</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {avgTimePerQuestion <= 60 ? "Fast" : avgTimePerQuestion <= 90 ? "Optimal" : "Pacing Needed"}
            </div>
            <span className="text-[11px] text-slate-500">Benchmark: &lt;72s / question</span>
          </CardContent>
        </Card>
      </div>

      {/* Section Time Distribution */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" /> Sectional Time Investment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.sectionResults.map((sec) => {
            const secMins = Math.floor(sec.timeSpentSeconds / 60);
            const secSecs = sec.timeSpentSeconds % 60;
            const avgSecTime = sec.attempted > 0 ? Math.round(sec.timeSpentSeconds / sec.attempted) : 0;

            return (
              <div
                key={sec.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div>
                  <h3 className="font-bold text-slate-900">{sec.sectionName}</h3>
                  <p className="text-slate-500 mt-0.5">
                    {sec.attempted} of {sec.totalQuestions} questions attempted
                  </p>
                </div>

                <div className="flex items-center gap-4 text-slate-700 font-semibold self-start sm:self-auto shrink-0">
                  <span>Total: {secMins}m {secSecs}s</span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Avg: {avgSecTime}s / Q
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
