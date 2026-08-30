import Link from "next/link";
import { ResultService } from "@/services/result/result.service";
import { getServerSession } from "@/lib/auth";
import { Award, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CandidateResultsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession();
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;

  if (!session) {
    return (
      <div className="p-12 text-center text-slate-500">
        Please <Link href="/login" className="text-blue-600 underline">login</Link> to view your results.
      </div>
    );
  }

  const resultData = await ResultService.getCandidateResults(session.id, {
    page,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Exam Results & Scorecards</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your official mock test evaluations, detailed question explanations, and diagnostic feedback.
        </p>
      </div>

      {resultData.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Award className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Tests Attempted Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Attempt a full-pattern mock or practice drill to see your official score and performance breakdown.
            </p>
            <div className="mt-6">
              <Button href="/candidate/mock-tests" size="sm" className="min-h-[44px]">Browse Mock Tests</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {resultData.items.map((r) => {
            const mock = r.attempt.mockTest;
            const netScore = Number(r.netScore);
            const totalMarks = Number(r.totalMarks);
            const accuracy = Number(r.accuracyRate);

            return (
              <Card key={r.id} className="shadow-sm hover:border-slate-300 transition-all">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{mock.type}</Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(r.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">{mock.title}</h2>
                    <p className="text-xs text-slate-500">
                      {mock.examVersion.exam.name} • {mock.examVersion.versionName}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                      <span className="flex items-center gap-1 font-semibold text-blue-700">
                        Score: {netScore.toFixed(2)} / {totalMarks} ({Number(r.percentage).toFixed(1)}%)
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        Accuracy: {accuracy.toFixed(1)}%
                      </span>
                      <span>
                        Attempted: {r.attemptedQuestions}/{r.totalQuestions}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button href={`/candidate/results/${r.id}`} size="sm" className="gap-1.5 font-bold min-h-[44px]">
                      View Scorecard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
