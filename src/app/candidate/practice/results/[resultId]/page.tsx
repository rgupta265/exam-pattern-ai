"use client";

import { useEffect, useState, use } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface PracticeResultData {
  result: {
    id: string;
    attemptId: string;
    testTitle: string;
    testCode: string;
    practiceType: string;
    totalQuestions: number;
    attemptedQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unattemptedQuestions: number;
    score: number;
    totalMarks: number;
    accuracyRate: number;
    percentage: number;
    geminiFeedback?: string | null;
    submittedAt: string | null;
  };
  questions: Array<{
    id: string;
    questionOrder: number;
    questionText: string;
    questionTextHindi?: string | null;
    explanation?: string | null;
    explanationHindi?: string | null;
    difficulty: string;
    topic?: string | null;
    marks: number;
    isAttempted: boolean;
    isCorrect: boolean;
    selectedOptionKey?: string | null;
    selectedOptionText?: string | null;
    correctOptionKey?: string | null;
    correctOptionText?: string | null;
    options: Array<{
      id: string;
      key: string;
      text: string;
      textHindi?: string | null;
      isCorrect: boolean;
    }>;
  }>;
}

export default function CandidatePracticeResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const resolvedParams = use(params);
  const resultId = resolvedParams.resultId;
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const [data, setData] = useState<PracticeResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "CORRECT" | "INCORRECT" | "UNATTEMPTED">("ALL");

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch(`/api/candidate/practice/results/${resultId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch {
        console.error("Failed to load result");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mx-auto mb-3" />
        <p className="text-slate-600 text-sm font-medium">Calculating practice scorecard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto bg-red-50 rounded-2xl border border-red-200">
        <p className="text-red-800 font-bold">Practice result not found.</p>
        <Button href="/candidate/practice" variant="outline" size="sm" className="mt-3">
          Back to Practice Drills
        </Button>
      </div>
    );
  }

  const { result, questions } = data;

  const filteredQuestions = questions.filter((q) => {
    if (filter === "CORRECT") return q.isCorrect;
    if (filter === "INCORRECT") return q.isAttempted && !q.isCorrect;
    if (filter === "UNATTEMPTED") return !q.isAttempted;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={localizePath("/candidate/practice", locale)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Practice Drills
      </Link>

      {/* Scorecard Hero */}
      <Card className="shadow-md border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white backdrop-blur-xs text-xs font-mono uppercase">
                  {result.testCode}
                </Badge>
                <span className="text-xs text-slate-200 font-medium">{result.practiceType.replace(/_/g, " ")}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{result.testTitle}</h1>
              <p className="text-xs text-slate-300">Practice Scorecard & Step-by-Step Diagnostic Review</p>
            </div>

            {/* Big Score Bubble */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
              <div className="text-center">
                <span className="text-xs font-bold text-slate-300 block uppercase">Net Score</span>
                <span className="text-3xl sm:text-4xl font-black text-white">{result.score}</span>
                <span className="text-xs text-slate-300"> / {result.totalMarks}</span>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <span className="text-xs font-bold text-slate-300 block uppercase">Accuracy</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {result.accuracyRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-slate-500 font-semibold block text-[11px]">Total Questions</span>
              <strong className="text-lg font-black text-slate-900 dark:text-white">{result.totalQuestions}</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[11px]">Correct Answers</span>
              <strong className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                {result.correctAnswers}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center">
              <span className="text-red-700 dark:text-red-400 font-semibold block text-[11px]">Incorrect Answers</span>
              <strong className="text-lg font-black text-red-700 dark:text-red-300">
                {result.incorrectAnswers}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
              <span className="text-amber-700 dark:text-amber-400 font-semibold block text-[11px]">Unattempted</span>
              <strong className="text-lg font-black text-amber-700 dark:text-amber-300">
                {result.unattemptedQuestions}
              </strong>
            </div>
          </div>

          {/* AI Diagnostic Report */}
          {result.geminiFeedback && (
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5">
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-blue-600" /> AI Practice Diagnostic Insights
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {result.geminiFeedback}
              </p>
            </div>
          )}

          {/* Isolation Notice */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Practice result is private and tracked independently. It does not affect official mock rankings.</span>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Review Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" /> Detailed Question Analysis
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${filter === "ALL" ? "bg-white dark:bg-slate-900 shadow-xs text-blue-600 font-extrabold" : "text-slate-600"}`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("CORRECT")}
              className={`px-3 py-1 rounded-lg transition-all ${filter === "CORRECT" ? "bg-white dark:bg-slate-900 shadow-xs text-emerald-600 font-extrabold" : "text-slate-600"}`}
            >
              Correct ({result.correctAnswers})
            </button>
            <button
              type="button"
              onClick={() => setFilter("INCORRECT")}
              className={`px-3 py-1 rounded-lg transition-all ${filter === "INCORRECT" ? "bg-white dark:bg-slate-900 shadow-xs text-red-600 font-extrabold" : "text-slate-600"}`}
            >
              Incorrect ({result.incorrectAnswers})
            </button>
            <button
              type="button"
              onClick={() => setFilter("UNATTEMPTED")}
              className={`px-3 py-1 rounded-lg transition-all ${filter === "UNATTEMPTED" ? "bg-white dark:bg-slate-900 shadow-xs text-amber-600 font-extrabold" : "text-slate-600"}`}
            >
              Skipped ({result.unattemptedQuestions})
            </button>
          </div>
        </div>

        {/* Question Cards */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isCorrect = q.isCorrect;
            const isSkipped = !q.isAttempted;

            return (
              <Card
                key={q.id}
                className={`border shadow-xs ${
                  isCorrect
                    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10"
                    : isSkipped
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-red-200 dark:border-red-900/50 bg-red-50/10"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-slate-500">
                      Question {q.questionOrder}
                    </span>

                    <Badge
                      variant={isCorrect ? "success" : isSkipped ? "outline" : "destructive"}
                      className="text-xs font-bold gap-1"
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+1.0)
                        </>
                      ) : isSkipped ? (
                        <>
                          <HelpCircle className="h-3.5 w-3.5" /> Unattempted (0.0)
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Incorrect (0.0)
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-1.5">
                    <p className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      {q.questionText}
                    </p>
                    {q.questionTextHindi && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {q.questionTextHindi}
                      </p>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt) => {
                      const isUserChoice = q.selectedOptionKey === opt.key;
                      const isOptionCorrect = opt.isCorrect;

                      let optClass = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300";
                      if (isOptionCorrect) {
                        optClass = "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-semibold";
                      } else if (isUserChoice && !isOptionCorrect) {
                        optClass = "border-red-500 bg-red-50/80 dark:bg-red-950/60 text-red-950 dark:text-red-100 font-semibold";
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${optClass}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="h-6 w-6 rounded-md font-bold text-xs flex items-center justify-center shrink-0 border bg-slate-100 dark:bg-slate-800">
                              {opt.key}
                            </span>
                            <div>
                              <span>{opt.text}</span>
                              {opt.textHindi && (
                                <span className="block text-slate-500 text-[11px]">{opt.textHindi}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 font-bold text-[11px]">
                            {isOptionCorrect && (
                              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Correct Answer
                              </span>
                            )}
                            {isUserChoice && !isOptionCorrect && (
                              <span className="text-red-700 dark:text-red-400 flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5" /> Your Choice
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Educational Explanation Box */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                        Educational Explanation & Rationale:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {q.explanation}
                      </p>
                      {q.explanationHindi && (
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-200 dark:border-slate-700">
                          {q.explanationHindi}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
