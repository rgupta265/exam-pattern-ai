import { notFound } from "next/navigation";
import { ResultService } from "@/services/result/result.service";
import { getServerSession } from "@/lib/auth";
import { ResultNavTabs } from "@/components/results/result-nav-tabs";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CandidateResultAnalysisPage({
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button href={`/candidate/results/${resultId}`} variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> Back to Scorecard
        </Button>
      </div>

      <ResultNavTabs resultId={resultId} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" /> Section-wise Comprehensive Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.sectionResults.map((sec) => {
            const acc = Number(sec.accuracy);
            const score = Number(sec.score);
            const totalMarks = Number(sec.totalMarks);

            return (
              <div
                key={sec.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{sec.sectionName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sec.totalQuestions} Questions • {totalMarks} Max Marks
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-emerald-700">+{sec.correct} Correct</span>
                    <span className="text-red-700">-{sec.incorrect} Wrong</span>
                    <span className="text-blue-700 font-extrabold text-sm">
                      {score.toFixed(2)} / {totalMarks} Marks
                    </span>
                  </div>
                </div>

                {/* Accuracy Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Section Accuracy</span>
                    <span className="text-slate-900">{acc.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        acc >= 70
                          ? "bg-emerald-500"
                          : acc >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, acc))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
