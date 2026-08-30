import { notFound } from "next/navigation";
import Link from "next/link";
import { CandidateAdminService } from "@/services/candidate/candidate-admin.service";
import { CandidateAdminNavTabs } from "@/components/candidates/candidate-admin-nav-tabs";
import {
  ArrowLeft,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCandidateAttemptDetailInspectionPage({
  params,
}: {
  params: Promise<{ candidateId: string; attemptId: string }>;
}) {
  const { candidateId, attemptId } = await params;
  let attempt;
  try {
    attempt = await CandidateAdminService.getCandidateAttemptDetail(candidateId, attemptId);
  } catch {
    notFound();
  }

  const mock = attempt.mockTest;
  const result = attempt.testResult;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href={`/admin/candidates/${candidateId}/attempts`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to Attempts Log
          </Button>
        </Link>
      </div>

      <CandidateAdminNavTabs candidateId={candidateId} />

      {/* Attempt Master Overview Banner */}
      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED" ? "success" : "warning"}>
                  {attempt.status}
                </Badge>
                <Badge variant="outline">{mock.type}</Badge>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-2">{mock.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {mock.examVersion.exam.name} • Started: {formatDate(attempt.startedAt)}
                {attempt.submittedAt ? ` • Submitted: ${formatDate(attempt.submittedAt)}` : ""}
              </p>
            </div>

            {result && (
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-center shrink-0">
                <span className="text-xs text-blue-600 font-semibold block">Evaluated Score</span>
                <strong className="text-2xl font-black text-blue-950">
                  {Number(result.netScore).toFixed(1)} / {Number(result.totalMarks)}
                </strong>
                <span className="text-xs text-blue-700 font-bold block mt-0.5">
                  {Number(result.accuracyRate).toFixed(0)}% Accuracy
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Audit Log (Questions, Selected Options, Revisions & Time) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> Candidate Answers & Interaction Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {attempt.answers.map((ans, idx) => (
            <div
              key={ans.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-900">
                  Item #{idx + 1} (Question ID: {ans.questionId})
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={ans.isAnswered ? "default" : "secondary"}>
                    {ans.isAnswered ? "Answered" : "Unanswered"}
                  </Badge>
                  {ans.isMarkedForReview && <Badge variant="warning">Marked for Review</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                <div>Selected Option: <strong className="text-slate-900">{ans.selectedOption?.optionKey || "None"}</strong></div>
                <div>Change Count: <strong className="text-slate-900">{ans.changeCount} revisions</strong></div>
                <div>Time Spent: <strong className="text-slate-900">{ans.timeSpentSeconds}s</strong></div>
                <div>Visited: <strong className="text-slate-900">{ans.isVisited ? "Yes" : "No"}</strong></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Real-time Interaction Event Stream Timeline */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" /> Attempt Interaction Event Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
            {attempt.answerEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-bold text-slate-900">{evt.eventType}</span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    (Offset: {(evt.timeOffsetMs / 1000).toFixed(0)}s)
                  </span>
                </div>
                <span className="text-slate-400 text-[10px]">{formatDate(evt.createdAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
