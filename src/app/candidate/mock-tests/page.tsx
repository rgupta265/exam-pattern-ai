"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  FileCheck,
  Zap,
  ArrowRight,
  RotateCcw,
  Award,
  Clock,
  ShieldCheck,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";
import { useLoading } from "@/components/common/loading-overlay";

interface ExamData {
  id: string;
  name: string;
  authority: string;
  versions: {
    id: string;
    versionName: string;
    blueprints: { id: string; title: string; totalQuestions: number; durationMinutes: number }[];
    syllabi: {
      sections: {
        id: string;
        name: string;
        topics: { id: string; name: string }[];
      }[];
    }[];
  }[];
}

interface MockTestItem {
  id: string;
  code?: string | null;
  title: string;
  type: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number | string;
  negativeRate: number | string;
  difficulty?: string;
  language?: string;
  examVersion: {
    versionName: string;
    exam: { name: string; authority: string };
  };
  _count?: {
    sections?: number;
    questions?: number;
  };
  userStats?: {
    totalAttempts: number;
    bestScore: number | null;
    latestScore: number | null;
    inProgressAttemptId: string | null;
    latestAttemptId: string | null;
    latestResultId: string | null;
    canRetake: boolean;
    maxAttempts: number;
  };
}

export default function CandidateMockTestsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);
  const { withLoading } = useLoading();

  const [mocks, setMocks] = useState<MockTestItem[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [examMode, setExamMode] = useState<"FULL_EXAM" | "TOPIC_DRILL">("FULL_EXAM");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [topicQCount, setTopicQCount] = useState(20);
  const [topicDifficulty, setTopicDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");

  const [isLoading, setIsLoading] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mocksRes, examsRes] = await Promise.all([
        fetch("/api/candidate/mock-tests?pageSize=30"),
        fetch("/api/exams?candidate=true&pageSize=30"),
      ]);

      const mocksData = await mocksRes.json();
      const examsData = await examsRes.json();

      if (mocksData.success && mocksData.data?.items) {
        setMocks(mocksData.data.items);
      }

      if (examsData.success && examsData.data?.items?.length > 0) {
        setExams(examsData.data.items);
        const first = examsData.data.items[0];
        setSelectedExamId(first.id);
        if (first.versions?.length > 0) {
          const firstVer = first.versions[0];
          setSelectedVersionId(firstVer.id);
          const firstTopic = firstVer.syllabi?.[0]?.sections?.[0]?.topics?.[0];
          if (firstTopic) setSelectedTopicId(firstTopic.id);
        }
      }
    } catch {
      console.error("Failed to load candidate mock tests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const currentVersion = currentExam?.versions?.find((v) => v.id === selectedVersionId);
  const topicsList = currentVersion?.syllabi?.[0]?.sections?.flatMap((s) => s.topics) || [];

  const handleStartExam = async (mockId: string) => {
    setStartError(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mockTestId: mockId }),
        });
        const json = await res.json();
        const attemptId = json.data?.id || json.data?.attempt?.id;

        if (json.success && attemptId) {
          router.push(localizePath(`/candidate/attempts/${attemptId}/instructions`, locale));
        } else {
          setStartError(json.error?.message || "Unable to start examination. Please verify mock test availability.");
        }
      } catch {
        setStartError("Network connection issue while initializing examination. Please retry.");
      }
    }, t("common.loading", "Preparing your examination..."));
  };

  const handleRetakeExam = async (mockId: string) => {
    setStartError(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mockTestId: mockId }),
        });
        const json = await res.json();
        const attemptId = json.data?.id || json.data?.attempt?.id;

        if (json.success && attemptId) {
          router.push(localizePath(`/candidate/attempts/${attemptId}/instructions`, locale));
        } else {
          setStartError(json.error?.message || "Unable to initialize fresh examination retake.");
        }
      } catch (err) {
        console.error("Retake error:", err);
        setStartError("Network error while creating new retake attempt.");
      }
    }, t("common.loading", "Initializing fresh examination attempt..."));
  };

  const handleGenerateTopicMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !selectedTopicId) return;

    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/mock-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examVersionId: selectedVersionId,
            topicId: selectedTopicId,
            questionCount: topicQCount,
            difficulty: topicDifficulty,
          }),
        });

        const data = await res.json();
        if (data.success && data.data?.mockTest) {
          router.push(localizePath(`/candidate/mock-tests/${data.data.mockTest.id}`, locale));
        }
      } catch {
        console.error("Failed to generate topic mock");
      }
    }, t("common.loading", "Generating topic practice drill..."));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
            {t("home.badge", "100% Pattern-Verified Mock Testing Engine")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t("navigation.mockTests", "Mock Tests")} & {t("navigation.practice", "Practice Drills")}
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          {t("candidateDashboard.subheading", "Prepare with full-pattern mocks strictly adhering to locked official exam blueprints and syllabus topics.")}
        </p>
      </div>

      {startError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-800 dark:text-red-300 font-medium"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <span>{startError}</span>
          </div>
          <button
            onClick={() => setStartError(null)}
            className="text-xs text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Selector & Quick Simulator Card */}
      <Card className="shadow-sm border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-bold">
                {examMode === "FULL_EXAM"
                  ? "Full Examination Mode (Official Pattern)"
                  : "Targeted Topic Practice Drill"}
              </CardTitle>
            </div>

            {/* Examination Mode Switcher */}
            <div className="inline-flex rounded-lg bg-white p-1 border border-slate-200 shadow-xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setExamMode("FULL_EXAM")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  examMode === "FULL_EXAM"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Full Examination
              </button>
              <button
                type="button"
                onClick={() => setExamMode("TOPIC_DRILL")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  examMode === "TOPIC_DRILL"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Topic Practice Drill
              </button>
            </div>
          </div>

          <CardDescription className="text-xs mt-1">
            {examMode === "FULL_EXAM"
              ? "Takes a complete official-pattern simulation with exact section distribution, negative marking, and timer."
              : "Generate an instant practice drill on a single verified syllabus topic."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {examMode === "FULL_EXAM" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Exam
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    const ex = exams.find((x) => x.id === e.target.value);
                    if (ex?.versions?.length) {
                      setSelectedVersionId(ex.versions[0].id);
                    }
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam Cycle / Version
                </label>
                <select
                  value={selectedVersionId}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  {currentExam?.versions?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.versionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    const matchingMock = mocks.find(
                      (m) => m.type === "FULL_MOCK" && m.examVersion.versionName === currentVersion?.versionName
                    ) || mocks[0];
                    if (matchingMock) {
                      handleStartExam(matchingMock.id);
                    }
                  }}
                  disabled={mocks.length === 0}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold gap-1.5 shadow-sm text-sm"
                >
                  <Play className="h-4 w-4" /> Start Full Examination
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateTopicMock} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    const ex = exams.find((x) => x.id === e.target.value);
                    if (ex?.versions?.length) {
                      setSelectedVersionId(ex.versions[0].id);
                      const firstTop = ex.versions[0].syllabi?.[0]?.sections?.[0]?.topics?.[0];
                      if (firstTop) setSelectedTopicId(firstTop.id);
                    }
                  }}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verified Syllabus Topic
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {topicsList.map((tItem) => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Questions & Difficulty
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={topicQCount}
                    onChange={(e) => setTopicQCount(parseInt(e.target.value, 10))}
                    className="w-1/2 h-11 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 Qs</option>
                    <option value={20}>20 Qs</option>
                    <option value={30}>30 Qs</option>
                    <option value={50}>50 Qs</option>
                  </select>
                  <select
                    aria-label="Target Difficulty"
                    value={topicDifficulty}
                    onChange={(e) => setTopicDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                    className="w-1/2 h-11 px-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold gap-1.5 shadow-sm"
                >
                  <Zap className="h-4 w-4" /> Start Drill
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Available Verified Mock Tests Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {t("candidateDashboard.availableExams", "Available Target Exams")}
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {mocks.length} Mock Tests Available
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-semibold">
            {t("common.loading", "Loading mock tests...")}
          </div>
        ) : mocks.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
                <FileCheck className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Full Mocks Available Yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Use the custom Topic Practice Generator above to take targeted practice drills.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mocks.map((mock) => {
              const stats = mock.userStats;
              const hasActiveAttempt = Boolean(stats?.inProgressAttemptId);
              const hasCompletedAttempt = Boolean(stats && stats.totalAttempts > 0);
              const canRetake = stats?.canRetake ?? true;

              return (
                <Card
                  key={mock.id}
                  className="shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-mono">
                        {mock.code || `MOCK-${mock.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[11px] font-semibold">
                          {mock.type === "FULL_MOCK" ? "Full Examination" : "Topic Drill"}
                        </Badge>
                        {stats && stats.totalAttempts > 0 && (
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Attempt {stats.totalAttempts}/{stats.maxAttempts}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                        {mock.title}
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {mock.examVersion.exam.name} • {mock.examVersion.versionName}
                      </p>
                    </div>

                    {/* Metadata Matrix */}
                    <div className="mt-2 grid grid-cols-3 gap-2 p-2.5 bg-blue-50/40 rounded-lg border border-blue-100 text-center text-xs">
                      <div>
                        <span className="block text-slate-400 text-[10px]">{t("mock.questions", "Questions")}</span>
                        <strong className="text-slate-900 font-bold">{mock.totalQuestions}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">{t("mock.totalMarks", "Total Marks")}</span>
                        <strong className="text-slate-900 font-bold">{mock.totalMarks.toString()}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">{t("mock.minutes", "Duration")}</span>
                        <strong className="text-slate-900 font-bold">{mock.durationMinutes}m</strong>
                      </div>
                    </div>

                    {/* Performance Summary if attempted */}
                    {stats && stats.bestScore !== null && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                        <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                          <Award className="h-3.5 w-3.5" /> Best Score: {stats.bestScore.toFixed(0)}%
                        </div>
                        {stats.latestScore !== null && (
                          <span className="text-[11px] text-emerald-700">Latest: {stats.latestScore.toFixed(0)}%</span>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 pb-4 space-y-2">
                    <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                      {hasActiveAttempt ? (
                        <Button
                          onClick={() => handleStartExam(mock.id)}
                          className="w-full font-bold min-h-[44px] gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <Clock className="h-4 w-4" /> {t("mock.resumeTest", "Resume Test")}
                        </Button>
                      ) : hasCompletedAttempt ? (
                        <div className="grid grid-cols-2 gap-2">
                          {stats?.latestResultId && (
                            <Button
                              href={localizePath(`/candidate/results/${stats.latestResultId}`, locale)}
                              variant="outline"
                              className="w-full font-semibold min-h-[44px] text-xs"
                            >
                              {t("mock.viewScorecard", "View Scorecard")}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleRetakeExam(mock.id)}
                            disabled={!canRetake}
                            className="w-full font-semibold min-h-[44px] text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Retake Exam
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleStartExam(mock.id)}
                          className="w-full font-bold min-h-[44px] gap-1.5 bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="h-4 w-4" /> {t("mock.startTest", "Start Test")}
                        </Button>
                      )}

                      <Button
                        href={localizePath(`/candidate/mock-tests/${mock.id}`, locale)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-slate-500 hover:text-slate-800"
                      >
                        View Structure & Blueprint <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
