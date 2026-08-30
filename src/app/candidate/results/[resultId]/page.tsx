import { notFound } from "next/navigation";
import { ResultService } from "@/services/result/result.service";
import { getServerSession } from "@/lib/auth";
import { ResultNavTabs } from "@/components/results/result-nav-tabs";
import {
  Award,
  ArrowLeft,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CandidateResultOverviewPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const session = await getServerSession();
  const { resultId } = await params;

  if (!session) {
    return notFound();
  }

  let result;
  try {
    result = await ResultService.getResultById(resultId, session.id);
  } catch {
    notFound();
  }

  const mock = result.attempt.mockTest;
  const netScore = Number(result.netScore);
  const totalMarks = Number(result.totalMarks);
  const rawScore = Number(result.rawScore);
  const penalty = Number(result.penaltyDeduction);
  const percentage = Number(result.percentage);
  const accuracy = Number(result.accuracyRate);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button href="/candidate/results" variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> All Results
        </Button>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Attempted on {formatDate(result.createdAt)}
        </span>
      </div>

      {/* Sub-route Navigation Tabs */}
      <ResultNavTabs resultId={resultId} />

      {/* Scorecard Hero Banner */}
      <Card className="shadow-sm border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{mock.type}</Badge>
              <Badge variant="success">Official Score Evaluated</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{mock.title}</h1>
            <p className="text-sm text-slate-600">
              {mock.examVersion.exam.name} ({mock.examVersion.versionName}) • Authority: {mock.examVersion.exam.authority}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-blue-100 shadow-sm shrink-0">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center font-extrabold shadow-md">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Net Score</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mt-0.5">
                {netScore.toFixed(2)}
                <span className="text-sm font-semibold text-slate-400"> / {totalMarks}</span>
              </div>
              <span className="text-xs font-bold text-blue-600 mt-1 block">
                {percentage.toFixed(1)}% Marks
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Accuracy</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{accuracy.toFixed(1)}%</div>
            <span className="text-[11px] text-slate-500">{result.correctAnswers} of {result.attemptedQuestions} correct</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Correct Answers</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">+{result.correctAnswers}</div>
            <span className="text-[11px] text-emerald-700">+{rawScore.toFixed(2)} Marks</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Negative Deduction</span>
            <div className="text-2xl font-bold text-red-600 mt-1">-{penalty.toFixed(2)}</div>
            <span className="text-[11px] text-red-700">{result.incorrectAnswers} wrong answers</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-slate-400 block font-semibold">Unanswered</span>
            <div className="text-2xl font-bold text-slate-600 mt-1">{result.unattemptedQuestions}</div>
            <span className="text-[11px] text-slate-400">0 penalty</span>
          </CardContent>
        </Card>
      </div>

      {/* Section-by-Section Score Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Sectional Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.sectionResults.map((sec) => (
              <div
                key={sec.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{sec.sectionName}</h3>
                  <div className="text-slate-500 mt-0.5">
                    {sec.attempted}/{sec.totalQuestions} Questions • Accuracy: {Number(sec.accuracy).toFixed(0)}%
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-700 font-semibold self-start sm:self-auto shrink-0">
                  <span className="text-emerald-700">+{sec.correct} Correct</span>
                  <span className="text-red-700">-{sec.incorrect} Wrong</span>
                  <span className="text-blue-700 font-bold text-sm">
                    Score: {Number(sec.score).toFixed(2)} / {Number(sec.totalMarks)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gemini AI Diagnostic Assessment */}
      {result.geminiFeedback && (
        <Card className="shadow-sm border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-bold">Gemini AI Diagnostic Performance Feedback</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 leading-relaxed">
            {result.geminiFeedback}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
