"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Menu,
  X,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface QuestionOption {
  id: string;
  optionKey: string;
  optionText: string;
  optionTextHindi?: string | null;
  sortOrder: number;
}

interface QuestionItem {
  id: string;
  questionText: string;
  questionTextHindi?: string | null;
  questionType: string;
  difficulty: string;
  options: QuestionOption[];
}

interface MockSection {
  id: string;
  name: string;
  sectionOrder: number;
  questions: {
    id: string;
    questionOrder: number;
    question: QuestionItem;
  }[];
}

interface UserAnswerState {
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  isVisited: boolean;
  timeSpentSeconds: number;
}

export default function CandidateExamRoomPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();

  // Core Attempt Data
  const [sections, setSections] = useState<MockSection[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Answers Map & UI states
  const [answers, setAnswers] = useState<Record<string, UserAnswerState>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<"ENGLISH" | "HINDI" | "BILINGUAL">("BILINGUAL");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const isHindi = locale === "hi";

  // Autosave answer choice to server
  const persistAnswerToServer = useCallback(
    async (
      questionId: string,
      optionId: string | null,
      isMarked: boolean,
      timeDelta: number
    ) => {
      try {
        await fetch(`/api/candidate/attempts/${attemptId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            selectedOptionId: optionId,
            isMarkedForReview: isMarked,
            timeSpentSeconds: timeDelta,
          }),
        });
      } catch {
        // Background retry silently
      }
    },
    [attemptId]
  );

  // Submission handler
  const handleSubmit = useCallback(async (isAuto = false) => {
    setIsSubmitting(true);
    const activeSec = sections[activeSectionIdx];
    const currentQ = activeSec?.questions?.[activeQuestionIdx]?.question;
    if (currentQ) {
      const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
      persistAnswerToServer(currentQ.id, answers[currentQ.id]?.selectedOptionId || null, answers[currentQ.id]?.isMarkedForReview || false, timeSpent);
    }

    try {
      const res = await fetch(`/api/candidate/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAutoSubmitted: isAuto }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const targetResultId = data.data?.resultId || data.data?.result?.id || attemptId;
        router.replace(localizePath(`/candidate/results/${targetResultId}`, locale));
      } else {
        setIsSubmitting(false);
        setIsSubmitModalOpen(false);
      }
    } catch {
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
    }
  }, [attemptId, sections, activeSectionIdx, activeQuestionIdx, answers, persistAnswerToServer, router, locale]);

  const handleAutoSubmit = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  // Load Attempt State
  const loadAttempt = useCallback(async () => {
    try {
      const res = await fetch(`/api/candidate/attempts/${attemptId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to load examination attempt details.");
        setIsLoading(false);
        return;
      }

      if (data.data.isExpired || data.data.attempt?.status === "SUBMITTED" || data.data.attempt?.status === "AUTO_SUBMITTED") {
        router.replace(localizePath(`/candidate/results/${attemptId}`, locale));
        return;
      }

      const mock = data.data.mockTest || data.data.attempt?.mockTest;
      if (!mock) {
        setError("Examination structure and questions could not be found.");
        setIsLoading(false);
        return;
      }

      setExamTitle(mock.title || "Full Pattern Examination");

      // Extract sections and nested questions
      const sortedSections = (mock.sections || []).sort(
        (a: MockSection, b: MockSection) => a.sectionOrder - b.sectionOrder
      );

      if (sortedSections.length === 0) {
        setError("This mock test does not have any sections configured.");
        setIsLoading(false);
        return;
      }

      setSections(sortedSections);

      // Hydrate answers map
      const initialAnswers: Record<string, UserAnswerState> = {};
      if (data.data.attempt?.answers) {
        data.data.attempt.answers.forEach((ans: { questionId: string; selectedOptionId: string | null; isMarkedForReview?: boolean; timeSpentSeconds?: number }) => {
          initialAnswers[ans.questionId] = {
            selectedOptionId: ans.selectedOptionId || null,
            isMarkedForReview: ans.isMarkedForReview || false,
            isVisited: true,
            timeSpentSeconds: ans.timeSpentSeconds || 0,
          };
        });
      }
      setAnswers(initialAnswers);
      setRemainingSeconds(data.data.remainingSeconds);
      setIsLoading(false);
      questionStartTimeRef.current = Date.now();
    } catch {
      setError("Network issue while loading examination room. Please check your connection.");
      setIsLoading(false);
    }
  }, [attemptId, router, locale]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Server-authoritative Timer with Warning State
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds, handleAutoSubmit]);

  // Autosave current question time spent
  const recordQuestionTime = useCallback(() => {
    const activeSec = sections[activeSectionIdx];
    const currentQ = activeSec?.questions?.[activeQuestionIdx]?.question;
    if (!currentQ) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || {
        selectedOptionId: null,
        isMarkedForReview: false,
        isVisited: true,
        timeSpentSeconds: 0,
      };
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          isVisited: true,
          timeSpentSeconds: existing.timeSpentSeconds + timeSpent,
        },
      };
    });
    questionStartTimeRef.current = Date.now();
  }, [sections, activeSectionIdx, activeQuestionIdx]);


  // Option selection handler
  const handleSelectOption = (optionId: string) => {
    const currentQ = sections[activeSectionIdx]?.questions?.[activeQuestionIdx]?.question;
    if (!currentQ) return;

    const currentAnswer = answers[currentQ.id];
    const newOptionId = currentAnswer?.selectedOptionId === optionId ? null : optionId;
    const isMarked = currentAnswer?.isMarkedForReview || false;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOptionId: newOptionId,
        isMarkedForReview: isMarked,
        isVisited: true,
        timeSpentSeconds: (prev[currentQ.id]?.timeSpentSeconds || 0) + 1,
      },
    }));

    persistAnswerToServer(currentQ.id, newOptionId, isMarked, 1);
  };

  // Mark for review toggle
  const handleToggleMarkReview = () => {
    const currentQ = sections[activeSectionIdx]?.questions?.[activeQuestionIdx]?.question;
    if (!currentQ) return;

    const currentAnswer = answers[currentQ.id];
    const newMarked = !currentAnswer?.isMarkedForReview;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selectedOptionId: prev[currentQ.id]?.selectedOptionId || null,
        isMarkedForReview: newMarked,
        isVisited: true,
        timeSpentSeconds: prev[currentQ.id]?.timeSpentSeconds || 0,
      },
    }));

    persistAnswerToServer(
      currentQ.id,
      currentAnswer?.selectedOptionId || null,
      newMarked,
      1
    );
  };

  // Clear answer
  const handleClearAnswer = () => {
    const currentQ = sections[activeSectionIdx]?.questions?.[activeQuestionIdx]?.question;
    if (!currentQ) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOptionId: null,
        isVisited: true,
      },
    }));

    persistAnswerToServer(
      currentQ.id,
      null,
      answers[currentQ.id]?.isMarkedForReview || false,
      1
    );
  };

  // Helper for section-relative question numbering
  const getSectionQuestionNumber = (sectionQuestionIndex: number): number => sectionQuestionIndex + 1;

  // Question navigation with cross-section transition support
  const handleNext = () => {
    recordQuestionTime();
    const currentSec = sections[activeSectionIdx];
    const isLastQInSec = activeQuestionIdx >= (currentSec?.questions?.length || 0) - 1;
    const isLastSec = activeSectionIdx >= sections.length - 1;

    if (!isLastQInSec) {
      // Advance to next question in same section
      setActiveQuestionIdx((prev) => prev + 1);
    } else if (!isLastSec) {
      // Transition from last question of Section A to first question of Section B
      setActiveSectionIdx((prev) => prev + 1);
      setActiveQuestionIdx(0);
    } else {
      // Last question of entire exam -> open submit confirmation modal
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrev = () => {
    recordQuestionTime();
    if (activeQuestionIdx > 0) {
      // Previous question in same section
      setActiveQuestionIdx((prev) => prev - 1);
    } else if (activeSectionIdx > 0) {
      // Transition back to the last question of the previous section
      const prevSecIdx = activeSectionIdx - 1;
      const prevSecQuestions = sections[prevSecIdx]?.questions || [];
      setActiveSectionIdx(prevSecIdx);
      setActiveQuestionIdx(Math.max(0, prevSecQuestions.length - 1));
    }
  };

  const handleNavigateQuestion = (sectionIdx: number, questionIdx: number) => {
    recordQuestionTime();
    setActiveSectionIdx(sectionIdx);
    setActiveQuestionIdx(questionIdx);
    setIsPaletteOpen(false);
  };

  // Format time (HH:MM:SS or MM:SS)
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">Unable to Start Examination</h2>
          <p className="text-xs text-slate-300">{error}</p>
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                loadAttempt();
              }}
              variant="outline"
              className="flex-1 text-xs border-slate-700 hover:bg-slate-700"
            >
              Retry
            </Button>
            <Button
              onClick={() => router.push(localizePath("/candidate/mock-tests", locale))}
              className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
            >
              Back to Mock Tests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Sparkles className="h-8 w-8 animate-pulse text-blue-400" />
        <p className="text-sm font-semibold tracking-wide">
          {isHindi ? "सुरक्षित परीक्षा कक्ष तैयार हो रहा है..." : "Initializing secure examination room..."}
        </p>
      </div>
    );
  }

  const currentSection = sections[activeSectionIdx] || sections[0];
  const currentQuestions = currentSection?.questions || [];
  const activeQuestionEntry = currentQuestions[activeQuestionIdx];
  const activeQuestion = activeQuestionEntry?.question;
  const currentAnswerState = activeQuestion ? answers[activeQuestion.id] : null;

  // Global counts for all sections
  const allQuestions = sections.flatMap((s) => s.questions || []);
  const totalQuestionCount = allQuestions.length;
  const answeredCount = allQuestions.filter((q) => Boolean(answers[q.question.id]?.selectedOptionId)).length;
  const markedCount = allQuestions.filter((q) => Boolean(answers[q.question.id]?.isMarkedForReview)).length;
  const notAnsweredCount = allQuestions.filter(
    (q) => answers[q.question.id]?.isVisited && !answers[q.question.id]?.selectedOptionId
  ).length;
  const notVisitedCount = totalQuestionCount - (answeredCount + notAnsweredCount);

  const isTimerWarning = remainingSeconds !== null && remainingSeconds <= 300; // < 5 mins
  const isFirstQuestionInEntireExam = activeSectionIdx === 0 && activeQuestionIdx === 0;
  const isLastQuestionInSection = activeQuestionIdx >= (currentQuestions.length - 1);
  const isLastQuestionInEntireExam = activeSectionIdx >= (sections.length - 1) && isLastQuestionInSection;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 select-none overflow-hidden font-sans">
      {/* 1. Full-Screen Top Header Bar */}
      <header className="h-14 md:h-16 bg-slate-900 text-white px-3 md:px-6 flex items-center justify-between border-b border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shrink-0 shadow-xs">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs md:text-sm font-bold truncate text-slate-100">
              {examTitle}
            </h1>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Section {activeSectionIdx + 1}/{sections.length}: {currentSection?.name}
            </p>
          </div>
        </div>

        {/* Center/Right: Language Toggle, Timer, Submit */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Language Toggle */}
          <div className="hidden sm:flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px] font-bold">
            <button
              onClick={() => setDisplayLanguage("ENGLISH")}
              className={`px-2 py-1 rounded-md transition-colors ${
                displayLanguage === "ENGLISH" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setDisplayLanguage("HINDI")}
              className={`px-2 py-1 rounded-md transition-colors ${
                displayLanguage === "HINDI" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              HI
            </button>
            <button
              onClick={() => setDisplayLanguage("BILINGUAL")}
              className={`px-2 py-1 rounded-md transition-colors ${
                displayLanguage === "BILINGUAL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Both
            </button>
          </div>

          {/* Resilient Server Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs md:text-sm border transition-colors ${
              isTimerWarning
                ? "bg-red-950/80 border-red-500 text-red-400 animate-pulse"
                : "bg-slate-800 border-slate-700 text-emerald-400"
            }`}
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span>{remainingSeconds !== null ? formatTimer(remainingSeconds) : "00:00"}</span>
          </div>

          {/* Palette Drawer Toggle (Mobile) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="md:hidden bg-slate-800 hover:bg-slate-700 text-white border-slate-700 h-8 px-2.5 text-xs font-semibold"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Submit Button */}
          <Button
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 md:h-9 px-3 text-xs shadow-xs"
          >
            {isHindi ? "परीक्षा सबमिट करें" : "Submit Exam"}
          </Button>
        </div>
      </header>

      {/* 2. Section Navigation Tabs */}
      <div className="h-10 bg-slate-800 text-white px-3 md:px-6 flex items-center gap-2 overflow-x-auto border-b border-slate-700 shrink-0 text-xs font-semibold">
        <span className="text-slate-400 uppercase tracking-wider text-[10px] hidden sm:inline mr-1">
          {isHindi ? "अनुभाग:" : "Sections:"}
        </span>
        {sections.map((sec, sIdx) => {
          const isCurrentSec = sIdx === activeSectionIdx;
          const secQuestions = sec.questions || [];
          const secAnsweredCount = secQuestions.filter((q) => Boolean(answers[q.question.id]?.selectedOptionId)).length;

          return (
            <button
              key={sec.id}
              onClick={() => {
                recordQuestionTime();
                setActiveSectionIdx(sIdx);
                setActiveQuestionIdx(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all shrink-0 text-xs ${
                isCurrentSec
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{sec.name}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({secAnsweredCount}/{secQuestions.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace: Question Area (Left) + Question Palette (Right) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Question & Options Column */}
        <main className="flex-1 flex flex-col justify-between p-4 md:p-6 overflow-y-auto bg-white dark:bg-slate-900">
          {activeQuestion ? (
            <div className="space-y-6 max-w-4xl">
              {/* Question Header & Meta with Section-Relative Numbering */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono text-xs px-2.5 py-0.5">
                    {currentSection?.name || "Section"}: Question {getSectionQuestionNumber(activeQuestionIdx)} of {currentQuestions.length}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold text-slate-500">
                    Marks: +1.0 / -0.25
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    (Overall: {allQuestions.findIndex((q) => q.question.id === activeQuestion.id) + 1} of {totalQuestionCount})
                  </span>
                </div>
                {currentAnswerState?.isMarkedForReview && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs font-semibold">
                    ★ {isHindi ? "समीक्षा हेतु चिह्नित" : "Marked for Review"}
                  </Badge>
                )}
              </div>

              {/* Question Statement */}
              <div className="space-y-3 text-slate-900 dark:text-slate-100">
                {(displayLanguage === "ENGLISH" || displayLanguage === "BILINGUAL" || !activeQuestion.questionTextHindi) && (
                  <div className="text-base sm:text-lg font-medium leading-relaxed">
                    {activeQuestion.questionText}
                  </div>
                )}
                {(displayLanguage === "HINDI" || displayLanguage === "BILINGUAL") && activeQuestion.questionTextHindi && (
                  <div className="text-base sm:text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-200 border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 font-serif">
                    {activeQuestion.questionTextHindi}
                  </div>
                )}
              </div>

              {/* Options Radio List */}
              <div className="space-y-3 pt-2">
                {activeQuestion.options.map((opt) => {
                  const isSelected = currentAnswerState?.selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all min-h-[48px] ${
                        isSelected
                          ? "bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-950 dark:bg-blue-950/60 dark:border-blue-500 dark:text-blue-100 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {opt.optionKey}
                      </span>
                      <div className="flex-1 space-y-1 pt-0.5 text-sm sm:text-base">
                        {(displayLanguage === "ENGLISH" || displayLanguage === "BILINGUAL" || !opt.optionTextHindi) && (
                          <div>{opt.optionText}</div>
                        )}
                        {(displayLanguage === "HINDI" || displayLanguage === "BILINGUAL") && opt.optionTextHindi && (
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-serif">
                            {opt.optionTextHindi}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              {isHindi ? "कोई प्रश्न उपलब्ध नहीं है।" : "No question available in this section."}
            </div>
          )}

          {/* Bottom Action Navigation Toolbar */}
          <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleMarkReview}
                className={`text-xs font-semibold min-h-[42px] ${
                  currentAnswerState?.isMarkedForReview
                    ? "bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <Bookmark className="h-4 w-4 mr-1.5" />
                {currentAnswerState?.isMarkedForReview
                  ? isHindi
                    ? "चिह्नित किया गया"
                    : "Marked for Review"
                  : isHindi
                  ? "समीक्षा हेतु चिह्नित करें"
                  : "Mark for Review"}
              </Button>

              {currentAnswerState?.selectedOptionId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAnswer}
                  className="text-xs text-slate-500 hover:text-red-600 min-h-[42px]"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {isHindi ? "उत्तर साफ़ करें" : "Clear Response"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={isFirstQuestionInEntireExam}
                className="font-semibold text-xs min-h-[42px]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> {isHindi ? "पिछला" : "Previous"}
              </Button>

              {isLastQuestionInEntireExam ? (
                <Button
                  size="sm"
                  onClick={() => {
                    recordQuestionTime();
                    setIsSubmitModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[42px] gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isHindi ? "सहेजें एवं सबमिट करें" : "Save & Submit"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs min-h-[42px]"
                >
                  {isHindi ? "सहेजें एवं अगला" : "Save & Next"} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </footer>
        </main>

        {/* 4. Question Palette Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`fixed md:static inset-y-0 right-0 z-40 w-72 md:w-80 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
            isPaletteOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                {isHindi ? "प्रश्न पैलेट (Question Palette)" : "Question Palette"}
              </h2>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Accessible Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-emerald-500 text-white font-bold flex items-center justify-center text-[9px]">
                  ✓
                </span>
                <span>{isHindi ? "उत्तर दिया गया" : "Answered"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-[9px]">
                  ★
                </span>
                <span>{isHindi ? "समीक्षा हेतु" : "Review"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-rose-500 text-white font-bold flex items-center justify-center text-[9px]">
                  ✗
                </span>
                <span>{isHindi ? "उत्तर नहीं दिया" : "Not Answered"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[9px]">
                  •
                </span>
                <span>{isHindi ? "नहीं देखा" : "Not Visited"}</span>
              </div>
            </div>

            {/* Matrix Grid for All Sections with Restarting Numbers (1..N) */}
            <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {sections.map((sec, sIdx) => {
                const secQuestions = sec.questions || [];
                const isSecActive = sIdx === activeSectionIdx;
                const secAnsweredCount = secQuestions.filter((q) => Boolean(answers[q.question.id]?.selectedOptionId)).length;

                return (
                  <div
                    key={sec.id}
                    className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          recordQuestionTime();
                          setActiveSectionIdx(sIdx);
                          setActiveQuestionIdx(0);
                        }}
                        className={`text-[11px] font-bold text-left hover:underline flex items-center gap-1.5 ${
                          isSecActive ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span>{sec.name}</span>
                        {isSecActive && (
                          <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded font-semibold">
                            Active
                          </span>
                        )}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {secAnsweredCount}/{secQuestions.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {secQuestions.map((qEntry, qIdx) => {
                        const qId = qEntry.question.id;
                        const ans = answers[qId];
                        const isCurrent = sIdx === activeSectionIdx && qIdx === activeQuestionIdx;
                        const isAnswered = Boolean(ans?.selectedOptionId);
                        const isMarked = Boolean(ans?.isMarkedForReview);
                        const isVisited = Boolean(ans?.isVisited);

                        let colorClasses = "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300";
                        if (isAnswered && isMarked) {
                          colorClasses = "bg-purple-600 text-white border-purple-700 ring-1 ring-emerald-400 font-bold";
                        } else if (isAnswered) {
                          colorClasses = "bg-emerald-500 text-white border-emerald-600 font-bold";
                        } else if (isMarked) {
                          colorClasses = "bg-purple-600 text-white border-purple-700 font-bold";
                        } else if (isVisited) {
                          colorClasses = "bg-rose-500 text-white border-rose-600 font-bold";
                        }

                        if (isCurrent) {
                          colorClasses += " ring-2 ring-blue-500 ring-offset-1";
                        }

                        const displayNum = getSectionQuestionNumber(qIdx);

                        return (
                          <button
                            key={qEntry.id}
                            type="button"
                            onClick={() => handleNavigateQuestion(sIdx, qIdx)}
                            className={`h-8 w-8 rounded-lg border text-xs flex items-center justify-center font-semibold transition-all ${colorClasses}`}
                            title={`Go to ${sec.name}, Question ${displayNum} of ${secQuestions.length}`}
                            aria-label={`Question ${displayNum} of ${secQuestions.length}, ${sec.name}`}
                          >
                            {displayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Statistics Summary */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>{isHindi ? "उत्तर दिए गए:" : "Answered:"}</span>
              <strong className="text-emerald-600 font-bold">{answeredCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>{isHindi ? "उत्तर नहीं दिए:" : "Not Answered:"}</span>
              <strong className="text-rose-600 font-bold">{notAnsweredCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>{isHindi ? "समीक्षा हेतु चिह्नित:" : "Marked for Review:"}</span>
              <strong className="text-purple-600 font-bold">{markedCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>{isHindi ? "नहीं देखे गए:" : "Not Visited:"}</span>
              <strong className="text-slate-500 font-bold">{notVisitedCount}</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* 5. Submission Confirmation Modal Dialog */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
              <h3 className="text-lg font-bold">
                {isHindi ? "क्या आप परीक्षा सबमिट करना चाहते हैं?" : "Submit Examination?"}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isHindi
                ? "कृपया अंतिम सबमिशन से पहले अपने प्रयास के आंकड़े देख लें। सबमिट करने के बाद उत्तर संशोधित नहीं किए जा सकेंगे।"
                : "Please review your test attempt statistics before finalizing. Answers cannot be modified once submitted."}
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs">
              <div>
                <span className="block text-slate-400">{isHindi ? "कुल प्रश्न" : "Total"}</span>
                <strong className="text-base font-bold text-slate-900 dark:text-white">{totalQuestionCount}</strong>
              </div>
              <div>
                <span className="block text-slate-400">{isHindi ? "उत्तर दिए" : "Answered"}</span>
                <strong className="text-base font-bold text-emerald-600">{answeredCount}</strong>
              </div>
              <div>
                <span className="block text-slate-400">{isHindi ? "समीक्षा हेतु" : "Review"}</span>
                <strong className="text-base font-bold text-purple-600">{markedCount}</strong>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSubmitModalOpen(false)}
                className="font-semibold text-xs"
              >
                {isHindi ? "परीक्षा जारी रखें" : "Resume Test"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isHindi ? "पुष्टि करें एवं सबमिट करें" : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
