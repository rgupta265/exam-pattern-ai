import { notFound } from "next/navigation";
import Link from "next/link";
import { ResultService } from "@/services/result/result.service";
import { CandidateAdminNavTabs } from "@/components/candidates/candidate-admin-nav-tabs";
import { ArrowLeft, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCandidateResultsPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  let resultsData;
  try {
    resultsData = await ResultService.getCandidateResults(candidateId, { page: 1, pageSize: 20 });
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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" /> Candidate Scorecards & Evaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resultsData.items.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center">No scorecards found for this candidate.</p>
          ) : (
            <div className="space-y-3">
              {resultsData.items.map((r) => (
                <div
                  key={r.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">{r.attempt.mockTest.title}</h3>
                    <p className="text-slate-500 text-[11px]">
                      {r.attempt.mockTest.examVersion.exam.name} • {formatDate(r.createdAt)}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                      <span className="text-blue-700">
                        Score: {Number(r.netScore).toFixed(1)} / {Number(r.totalMarks)}
                      </span>
                      <span className="text-emerald-700">Accuracy: {Number(r.accuracyRate).toFixed(0)}%</span>
                      <span className="text-slate-500">Attempted: {r.attemptedQuestions}/{r.totalQuestions}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link href={`/candidate/results/${r.id}`}>
                      <Button size="sm" variant="outline" className="text-xs font-semibold min-h-[36px]">
                        Inspect Full Scorecard
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
