"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface PracticeOption {
  id: string;
  optionKey: string;
  optionText: string;
  optionTextHindi?: string | null;
}

interface PracticeQuestionItem {
  id: string;
  questionOrder: number;
  questionText: string;
  questionTextHindi?: string | null;
  marks: number;
  options: PracticeOption[];
}

interface AttemptData {
  attempt: {
    id: string;
    status: string;
    startedAt: string;
  };
  practiceTest: {
    id: string;
    code: string;
    title: string;
    durationMinutes: number;
    totalQuestions: number;
    questions: PracticeQuestionItem[];
  };
}

export default function CandidatePracticeAttemptPage({
  params,
}: {
  params: Promise<{ practiceTestId: string }>;
}) {
  const resolvedParams = use(params);
  const practiceTestId = resolvedParams.practiceTestId;
  const router = useRouter();

  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId: string | null; isMarkedForReview: boolean }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  // Initialize practice attempt session
  useEffect(() => {
    async function initAttempt() {
      try {
        const res = await fetch(`/api/candidate/practice/${practiceTestId}/attempt`, {
          method: "POST",
        });

        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          const durationSecs = (json.data.practiceTest.durationMinutes || 15) * 60;
          setTimeLeft(durationSecs);
        } else {
          router.push(localizePath(`/candidate/practice/${practiceTestId}`, locale));
        }
      } catch {
        router.push(localizePath("/candidate/practice", locale));
      } finally {
        setLoading(false);
      }
    }

    initAttempt();
  }, [practiceTestId, router, locale]);

  // Submit attempt handler
  const handleSubmit = useCallback(async () => {
    if (!data?.attempt?.id || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/candidate/practice/attempts/${data.attempt.id}/submit`, {
        method: "POST",
      });

      const json = await res.json();
      if (json.success && json.data?.result?.id) {
        router.push(localizePath(`/candidate/practice/results/${json.data.result.id}`, locale));
      } else {
        router.push(localizePath("/candidate/practice", locale));
      }
    } catch {
      router.push(localizePath("/candidate/practice", locale));
    }
  }, [data, isSubmitting, router, locale]);

  // Timer countdown and auto-submit on expiry
  useEffect(() => {
    if (timeLeft <= 0 || !data) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data, handleSubmit, timeLeft]);

  // Autosave answer on change
  const saveAnswer = async (questionId: string, selectedOptionId: string | null, isMarkedForReview: boolean) => {
    if (!data?.attempt?.id) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedOptionId, isMarkedForReview },
    }));

    try {
      await fetch(`/api/candidate/practice/attempts/${data.attempt.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          selectedOptionId,
          isMarkedForReview,
          timeSpentSeconds: 5,
        }),
      });
    } catch {
      // Silent autosave failure catch
    }
  };

  const handleOptionSelect = (optionId: string) => {
    const q = data?.practiceTest.questions[currentIdx];
    if (!q) return;

    const current = answers[q.id] || { selectedOptionId: null, isMarkedForReview: false };
    const newSelected = current.selectedOptionId === optionId ? null : optionId;
    saveAnswer(q.id, newSelected, current.isMarkedForReview);
  };

  const handleClearAnswer = () => {
    const q = data?.practiceTest.questions[currentIdx];
    if (!q) return;
    const current = answers[q.id] || { selectedOptionId: null, isMarkedForReview: false };
    saveAnswer(q.id, null, current.isMarkedForReview);
  };

  const handleToggleMarkForReview = () => {
    const q = data?.practiceTest.questions[currentIdx];
    if (!q) return;
    const current = answers[q.id] || { selectedOptionId: null, isMarkedForReview: false };
    const nextMarked = !current.isMarkedForReview;
    saveAnswer(q.id, current.selectedOptionId, nextMarked);

    // Auto-advance to next question if not at end
    if (currentIdx < (data?.practiceTest.questions.length || 0) - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-blue-600 border-r-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Loading your practice drill...</p>
        </div>
      </div>
    );
  }

  const questions = data.practiceTest.questions;
  const currentQ = questions[currentIdx];
  const currentAns = currentQ ? answers[currentQ.id] : null;

  // Palette counts
  const answeredCount = Object.values(answers).filter((a) => a.selectedOptionId !== null).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Fixed Control Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            {data.practiceTest.code}
          </Badge>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white hidden sm:block truncate max-w-xs md:max-w-md">
            {data.practiceTest.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-mono text-sm tracking-wider">{formatTimer(timeLeft)}</span>
          </div>

          {/* Palette toggle for mobile */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="md:hidden p-2 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Open Question Palette"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Submit Test Button */}
          <Button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl min-h-[38px] gap-1.5 shadow-xs"
          >
            <Send className="h-3.5 w-3.5" /> Submit Drill
          </Button>
        </div>
      </header>

      {/* Main Grid: Question Card + Palette */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Question Area (8 cols on desktop) */}
        <main className="md:col-span-8 lg:col-span-9 space-y-4">
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 sm:p-7 space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">1.0 Mark</span>
                  {currentAns?.isMarkedForReview && (
                    <Badge variant="warning" className="text-[10px] gap-1">
                      <Bookmark className="h-3 w-3 fill-amber-500" /> Review
                    </Badge>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.questionText}
                </p>
                {currentQ.questionTextHindi && (
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {currentQ.questionTextHindi}
                  </p>
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = currentAns?.selectedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleOptionSelect(opt.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer min-h-[48px] ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {opt.optionKey}
                      </span>

                      <div className="space-y-0.5 pt-0.5 flex-1">
                        <p className={`text-sm ${isSelected ? "font-bold text-blue-950 dark:text-blue-100" : "font-medium text-slate-800 dark:text-slate-200"}`}>
                          {opt.optionText}
                        </p>
                        {opt.optionTextHindi && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {opt.optionTextHindi}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Question Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAnswer}
                  disabled={!currentAns?.selectedOptionId}
                  className="gap-1.5 text-xs text-slate-600 dark:text-slate-400 min-h-[40px]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear Selection
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleMarkForReview}
                  className={`gap-1.5 text-xs min-h-[40px] ${
                    currentAns?.isMarkedForReview
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 border-amber-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 font-semibold"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {currentAns?.isMarkedForReview ? "Marked for Review" : "Mark for Review & Next"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Prev / Next Nav */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              className="gap-1.5 font-bold text-xs min-h-[44px] px-5"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <span className="text-xs font-semibold text-slate-500">
              {currentIdx + 1} of {questions.length}
            </span>

            <Button
              type="button"
              onClick={() => {
                if (currentIdx < questions.length - 1) {
                  setCurrentIdx((prev) => prev + 1);
                } else {
                  setShowSubmitModal(true);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs min-h-[44px] px-6 gap-1.5"
            >
              {currentIdx === questions.length - 1 ? "Review & Submit" : "Save & Next"} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </main>

        {/* Desktop Side Question Palette (4 cols on desktop) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4">
          <Card className="shadow-sm sticky top-20">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question Palette ({questions.length})
              </h3>

              {/* Status summary counters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold text-center">
                  <span className="block text-base font-bold">{answeredCount}</span>
                  Answered
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold text-center">
                  <span className="block text-base font-bold">{markedCount}</span>
                  Marked
                </div>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
                {questions.map((q, idx) => {
                  const a = answers[q.id];
                  const isCurrent = idx === currentIdx;
                  const isAnswered = a?.selectedOptionId !== null && a?.selectedOptionId !== undefined;
                  const isMarked = a?.isMarkedForReview;

                  let btnColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                  if (isCurrent) {
                    btnColor = "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400 font-black";
                  } else if (isMarked) {
                    btnColor = "bg-amber-500 text-white border-amber-500 font-bold";
                  } else if (isAnswered) {
                    btnColor = "bg-emerald-600 text-white border-emerald-600 font-bold";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-9 w-full rounded-lg text-xs border transition-all cursor-pointer flex items-center justify-center ${btnColor}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile Drawer Question Palette */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setPaletteOpen(false)} />
          <aside className="relative ml-auto flex w-72 max-w-[85vw] flex-1 flex-col bg-white dark:bg-slate-900 p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-bold">Question Palette</span>
              <button type="button" onClick={() => setPaletteOpen(false)} className="p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[70vh]">
              {questions.map((q, idx) => {
                const a = answers[q.id];
                const isCurrent = idx === currentIdx;
                const isAnswered = a?.selectedOptionId !== null && a?.selectedOptionId !== undefined;
                const isMarked = a?.isMarkedForReview;

                let btnColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 border-slate-200";
                if (isCurrent) {
                  btnColor = "bg-blue-600 text-white font-black";
                } else if (isMarked) {
                  btnColor = "bg-amber-500 text-white";
                } else if (isAnswered) {
                  btnColor = "bg-emerald-600 text-white";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentIdx(idx);
                      setPaletteOpen(false);
                    }}
                    className={`h-9 w-full rounded-lg text-xs border cursor-pointer flex items-center justify-center ${btnColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Confirm Submission
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you ready to submit your practice drill? You will receive immediate score analysis and step-by-step educational explanations.
            </p>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block">Answered:</span>
                <strong className="text-emerald-600 font-bold">{answeredCount} of {questions.length}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Unattempted:</span>
                <strong className="text-amber-600 font-bold">{questions.length - answeredCount}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="text-xs font-semibold"
              >
                Continue Drill
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 min-h-[40px]"
              >
                Yes, Submit Drill
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
