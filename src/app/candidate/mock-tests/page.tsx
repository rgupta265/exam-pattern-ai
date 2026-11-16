"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Sparkles,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";
import { useLoading } from "@/components/common/loading-overlay";

interface BlueprintSection {
  id: string;
  name: string;
  sectionOrder: number;
  questionCount: number;
  marksPerQuestion?: number | string;
  negativeRate?: number | string;
}

interface ExamData {
  id: string;
  name: string;
  authority: string;
  versions: {
    id: string;
    versionName: string;
    blueprints: {
      id: string;
      title: string;
      totalQuestions: number;
      durationMinutes: number;
      totalMarks?: number | string;
      negativeMarkingRate?: number | string;
      sections?: BlueprintSection[];
    }[];
    syllabi: {
      sections: {
        id: string;
        name: string;
        topics: { id: string; name: string; code?: string }[];
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
  const [topicQCount, setTopicQCount] = useState<number>(20);
  const [topicDifficulty, setTopicDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [topicLanguage, setTopicLanguage] = useState<string>("English");

  // Catalog Filters
  const [filterType, setFilterType] = useState<"ALL" | "FULL_MOCK" | "TOPIC_PRACTICE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mocksRes, examsRes] = await Promise.all([
        fetch("/api/candidate/mock-tests?pageSize=50"),
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

  const currentExam = useMemo(() => exams.find((e) => e.id === selectedExamId), [exams, selectedExamId]);
  const currentVersion = useMemo(
    () => currentExam?.versions?.find((v) => v.id === selectedVersionId) || currentExam?.versions?.[0],
    [currentExam, selectedVersionId]
  );
  const currentBlueprint = currentVersion?.blueprints?.[0];
  const syllabusSections = useMemo(() => currentVersion?.syllabi?.[0]?.sections || [], [currentVersion]);

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

  // Generate 100% Syllabus-Accurate Full Exam Mock Test
  const handleGenerateFullMock = async () => {
    if (!selectedVersionId) return;
    setStartError(null);

    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/mock-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "FULL_MOCK",
            examVersionId: selectedVersionId,
            generationMode: "FULL_PATTERN",
            generateMissingWithAi: true,
          }),
        });

        const data = await res.json();
        if (data.success && data.data?.mockTest) {
          await loadData();
          router.push(localizePath(`/candidate/mock-tests/${data.data.mockTest.id}`, locale));
        } else {
          setStartError(data.error?.message || "Failed to generate full pattern mock test.");
        }
      } catch (err) {
        console.error("Full mock generation error:", err);
        setStartError("Network error while generating full pattern mock test.");
      }
    }, t("common.loading", "Generating 100% blueprint-accurate full mock test with exact question count..."));
  };

  // Generate Topic-Specific Practice Drill
  const handleGenerateTopicMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !selectedTopicId) return;
    setStartError(null);

    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/mock-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "TOPIC_PRACTICE",
            examVersionId: selectedVersionId,
            topicId: selectedTopicId,
            questionCount: topicQCount,
            difficulty: topicDifficulty,
            language: topicLanguage,
          }),
        });

        const data = await res.json();
        if (data.success && data.data?.mockTest) {
          await loadData();
          router.push(localizePath(`/candidate/mock-tests/${data.data.mockTest.id}`, locale));
        } else {
          setStartError(data.error?.message || "Failed to generate topic practice drill.");
        }
      } catch {
        setStartError("Network error while generating topic practice drill.");
      }
    }, t("common.loading", "Generating topic practice drill strictly bounded by verified syllabus..."));
  };

  // Filtered Catalog
  const filteredMocks = useMemo(() => {
    return mocks.filter((m) => {
      if (filterType === "FULL_MOCK" && m.type !== "FULL_MOCK") return false;
      if (filterType === "TOPIC_PRACTICE" && m.type !== "TOPIC_PRACTICE") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = m.code?.toLowerCase().includes(q);
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchExam = m.examVersion.exam.name.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchExam) return false;
      }
      return true;
    });
  }, [mocks, filterType, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
            {t("home.badge", "100% Pattern-Verified Mock Testing Engine")}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {t("navigation.mockTests", "Mock Tests")} & {t("navigation.practice", "Practice Drills")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
          {t(
            "candidateDashboard.subheading",
            "Prepare with full-pattern mocks strictly adhering to locked official blueprints with exact question counts, or generate topic-specific drills bounded by the verified syllabus."
          )}
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
      <Card className="shadow-sm border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg font-bold">
                {examMode === "FULL_EXAM"
                  ? "Full Examination Mode (100% Blueprint Accurate)"
                  : "Targeted Topic Practice Drill"}
              </CardTitle>
            </div>

            {/* Examination Mode Switcher */}
            <div className="inline-flex rounded-lg bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setExamMode("FULL_EXAM")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  examMode === "FULL_EXAM"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Topic Practice Drill
              </button>
            </div>
          </div>

          <CardDescription className="text-xs mt-1">
            {examMode === "FULL_EXAM"
              ? "Takes or generates a complete official-pattern simulation with exact section distribution, question quota, negative marking, and duration."
              : "Generate a custom practice drill on a single verified syllabus topic with your chosen question count and difficulty."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {examMode === "FULL_EXAM" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Cycle / Version
                  </label>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {currentExam?.versions?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.versionName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Authoritative Blueprint Information Card */}
              {currentBlueprint && (
                <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-[11px] gap-1 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 100% Blueprint Verified
                      </Badge>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs sm:max-w-md">
                        {currentBlueprint.title || "Official Examination Blueprint"}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      Target: {currentBlueprint.totalQuestions} Qs • {currentBlueprint.durationMinutes}m •{" "}
                      {currentBlueprint.totalMarks ? Number(currentBlueprint.totalMarks) : currentBlueprint.totalQuestions}{" "}
                      Marks • Neg: -{currentBlueprint.negativeMarkingRate ? Number(currentBlueprint.negativeMarkingRate) : 0.25}
                    </span>
                  </div>

                  {currentBlueprint.sections && currentBlueprint.sections.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {currentBlueprint.sections.map((sec) => (
                        <div
                          key={sec.id}
                          className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                            Section {sec.sectionOrder}: {sec.name}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {sec.questionCount} Questions
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <Button
                  type="button"
                  onClick={handleGenerateFullMock}
                  disabled={!selectedVersionId}
                  className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold gap-2 shadow-sm text-xs sm:text-sm flex-1 min-h-[44px]"
                >
                  <Sparkles className="h-4 w-4 shrink-0" /> Generate New Full Mock Test ({currentBlueprint?.totalQuestions || 100} Qs)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const matchingMock =
                      mocks.find(
                        (m) => m.type === "FULL_MOCK" && m.examVersion.versionName === currentVersion?.versionName
                      ) ||
                      mocks.find((m) => m.type === "FULL_MOCK") ||
                      mocks[0];
                    if (matchingMock) {
                      handleStartExam(matchingMock.id);
                    }
                  }}
                  disabled={mocks.filter((m) => m.type === "FULL_MOCK").length === 0}
                  className="h-11 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 font-bold gap-1.5 shadow-xs text-xs sm:text-sm flex-1 min-h-[44px]"
                >
                  <Play className="h-4 w-4 shrink-0" /> Start Existing Verified Mock
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateTopicMock} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Exam */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Exam
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
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exam Cycle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Version
                  </label>
                  <select
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {currentExam?.versions?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.versionName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verified Syllabus Topic */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Verified Syllabus Topic (100% Accurate)
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  >
                    {syllabusSections.map((sec) => (
                      <optgroup key={sec.id} label={sec.name}>
                        {sec.topics.map((tItem) => (
                          <option key={tItem.id} value={tItem.id}>
                            {tItem.code ? `[${tItem.code}] ` : ""}
                            {tItem.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Question Count */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exact Questions Count
                  </label>
                  <select
                    value={topicQCount}
                    onChange={(e) => setTopicQCount(parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={30}>30 Questions</option>
                    <option value={50}>50 Questions</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Difficulty
                  </label>
                  <select
                    aria-label="Target Difficulty"
                    value={topicDifficulty}
                    onChange={(e) => setTopicDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Language
                  </label>
                  <select
                    value={topicLanguage}
                    onChange={(e) => setTopicLanguage(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                {/* Submit */}
                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-sm text-xs sm:text-sm min-h-[44px]"
                  >
                    <Zap className="h-4 w-4" /> Generate Drill ({topicQCount} Qs)
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Available Verified Mock Tests Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t("candidateDashboard.availableExams", "Available Target Exams")}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Showing {filteredMocks.length} of {mocks.length} Mock Tests
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterType === "ALL" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                All ({mocks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("FULL_MOCK")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterType === "FULL_MOCK" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Full Mocks ({mocks.filter((m) => m.type === "FULL_MOCK").length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("TOPIC_PRACTICE")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterType === "TOPIC_PRACTICE" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Topic Drills ({mocks.filter((m) => m.type === "TOPIC_PRACTICE").length})
              </button>
            </div>

            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search mock tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-semibold">
            {t("common.loading", "Loading mock tests...")}
          </div>
        ) : filteredMocks.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-4">
                <FileCheck className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Matching Mock Tests</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Use the generator controls above to create a fresh 100% syllabus-accurate mock test or topic drill.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMocks.map((mock) => {
              const stats = mock.userStats;
              const hasActiveAttempt = Boolean(stats?.inProgressAttemptId);
              const hasCompletedAttempt = Boolean(stats && stats.totalAttempts > 0);
              const canRetake = stats?.canRetake ?? true;

              return (
                <Card
                  key={mock.id}
                  className="shadow-sm hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all flex flex-col justify-between"
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
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            Attempt {stats.totalAttempts}/{stats.maxAttempts}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {mock.title}
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {mock.examVersion.exam.name} • {mock.examVersion.versionName}
                      </p>
                    </div>

                    {/* Metadata Matrix */}
                    <div className="mt-2 grid grid-cols-3 gap-2 p-2.5 bg-blue-50/40 dark:bg-slate-800/40 rounded-lg border border-blue-100 dark:border-slate-800 text-center text-xs">
                      <div>
                        <span className="block text-slate-400 text-[10px]">{t("mock.questions", "Questions")}</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">{mock.totalQuestions}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">{t("mock.totalMarks", "Total Marks")}</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">{mock.totalMarks.toString()}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">{t("mock.minutes", "Duration")}</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">{mock.durationMinutes}m</strong>
                      </div>
                    </div>

                    {/* Performance Summary if attempted */}
                    {stats && stats.bestScore !== null && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-semibold">
                          <Award className="h-3.5 w-3.5" /> Best Score: {stats.bestScore.toFixed(0)}%
                        </div>
                        {stats.latestScore !== null && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Latest: {stats.latestScore.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 pb-4 space-y-2">
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-2">
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
                            className="w-full font-semibold min-h-[44px] text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Retake Exam
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleStartExam(mock.id)}
                          className="w-full font-bold min-h-[44px] gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Play className="h-4 w-4" /> {t("mock.startTest", "Start Test")}
                        </Button>
                      )}

                      <Button
                        href={localizePath(`/candidate/mock-tests/${mock.id}`, locale)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
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
