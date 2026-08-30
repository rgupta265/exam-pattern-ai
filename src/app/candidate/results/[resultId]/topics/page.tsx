import { notFound } from "next/navigation";
import { ResultService } from "@/services/result/result.service";
import { getServerSession } from "@/lib/auth";
import { ResultNavTabs } from "@/components/results/result-nav-tabs";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CandidateResultTopicsPage({
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

  const strongTopics = result.topicResults.filter((t) => Number(t.accuracy) >= 70);
  const weakTopics = result.topicResults.filter((t) => Number(t.accuracy) < 50);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button href={`/candidate/results/${resultId}`} variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> Back to Scorecard
        </Button>
      </div>

      <ResultNavTabs resultId={resultId} />

      {/* Strong & Weak Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strong Topics */}
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> Identified Strong Topics (≥70% Accuracy)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {strongTopics.length === 0 ? (
              <p className="text-slate-500 italic">No topics achieved ≥70% accuracy in this attempt.</p>
            ) : (
              strongTopics.map((t) => (
                <div key={t.id} className="p-3 bg-white rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.topicName}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {Number(t.accuracy).toFixed(0)}% Accuracy
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weak Topics */}
        <Card className="shadow-sm border-red-200 bg-red-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-red-950 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" /> Focus Topics for Improvement (&lt;50% Accuracy)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {weakTopics.length === 0 ? (
              <p className="text-slate-500 italic">No critical weak topics (&lt;50%) in this attempt.</p>
            ) : (
              weakTopics.map((t) => (
                <div key={t.id} className="p-3 bg-white rounded-lg border border-red-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.topicName}</span>
                  <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    {Number(t.accuracy).toFixed(0)}% Accuracy
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete Topic Performance Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">All Syllabus Topics Evaluated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {result.topicResults.map((t) => {
              const acc = Number(t.accuracy);

              return (
                <div
                  key={t.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{t.topicName}</h3>
                    <p className="text-slate-500 mt-0.5">
                      {t.totalQuestions} Questions • Attempted: {t.attempted} ({t.correct} Correct, {t.incorrect} Wrong)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                    <span className={`font-bold px-2.5 py-1 rounded-lg ${
                      acc >= 70
                        ? "bg-emerald-100 text-emerald-800"
                        : acc >= 50
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {acc.toFixed(1)}% Accuracy
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
