"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface VersionOption {
  id: string;
  versionName: string;
  year: number;
  notificationNumber?: string | null;
}

interface PatternSummarySection {
  sectionId?: string;
  sectionName: string;
  sectionOrder: number;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  negativeRate: number;
  availableQuestionsCount: number;
  missingQuestionsCount: number;
}

interface PatternSummaryData {
  examId: string;
  examName: string;
  examCode: string;
  examVersionId: string;
  versionName: string;
  advertisementNumber?: string | null;
  blueprintId: string;
  blueprintTitle: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarkingRate: number;
  difficulty: string;
  language: string;
  totalAvailableQuestions: number;
  totalMissingQuestions: number;
  isQuestionBankSufficient: boolean;
  sections: PatternSummarySection[];
  verifiedDocuments: Array<{ id: string; title: string; type: string }>;
}

export default function CreateMockTestWizardPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const examId = params?.examId as string;

  const [versions, setVersions] = useState<VersionOption[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [patternSummary, setPatternSummary] = useState<PatternSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Generation options
  const [generationType, setGenerationType] = useState<"FULL_PATTERN" | "QUICK">("FULL_PATTERN");
  const [generateMissingWithAi, setGenerateMissingWithAi] = useState(true);
  const [quickQuestionCount, setQuickQuestionCount] = useState(25);
  const [customTitle, setCustomTitle] = useState("");

  // Action states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadPatternSummary = useCallback(async (versionId: string) => {
    if (!versionId) return;
    try {
      const res = await fetch(`/api/mock-tests/pattern-summary?examVersionId=${versionId}`);
      const json = await res.json();
      if (json.success && json.data?.patternSummary) {
        setPatternSummary(json.data.patternSummary);
      } else {
        setPatternSummary(null);
      }
    } catch {
      console.error("Failed to load pattern summary");
      setPatternSummary(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const verRes = await fetch(`/api/exams/${examId}/versions`);
      const verJson = await verRes.json();

      if (verJson.success && verJson.data?.versions?.length > 0) {
        setVersions(verJson.data.versions);
        const firstVer = verJson.data.versions[0];
        setSelectedVersionId(firstVer.id);
        await loadPatternSummary(firstVer.id);
      }
    } catch {
      setError("Network error fetching exam details.");
    } finally {
      setLoading(false);
    }
  }, [examId, loadPatternSummary]);

  useEffect(() => {
    if (examId) loadData();
  }, [examId, loadData]);

  const handleVersionSelect = (verId: string) => {
    setSelectedVersionId(verId);
    loadPatternSummary(verId);
  };

  // FULL PATTERN OR QUICK MOCK GENERATION
  const handleGenerate = async () => {
    if (!selectedVersionId) return;
    setIsGenerating(true);
    setError(null);
    setGenerationStep("Analyzing authoritative exam pattern configuration...");

    try {
      setGenerationStep("Checking question bank availability across syllabus topics...");

      const res = await fetch("/api/mock-tests/generate-actual-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examVersionId: selectedVersionId,
          blueprintId: patternSummary?.blueprintId,
          customTitle: customTitle.trim() || undefined,
          generationMode: generationType,
          generateMissingWithAi,
          quickQuestionCount: generationType === "QUICK" ? quickQuestionCount : undefined,
        }),
      });

      setGenerationStep("Assembling section-by-section questions and validating 100% compliance...");

      const json = await res.json();
      if (json.success && json.data?.mockTest?.id) {
        setGenerationStep("Full mock test generated successfully! Redirecting...");
        router.push(localizePath(`/admin/mock-tests/${json.data.mockTest.id}`, locale));
      } else {
        setError(json.error?.message || "Mock generation failed.");
        setIsGenerating(false);
        setGenerationStep("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error during mock generation.");
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const isFull = generationType === "FULL_PATTERN";
  const requiredCount = patternSummary?.totalQuestions || 0;
  const availableCount = patternSummary?.totalAvailableQuestions || 0;
  const missingCount = patternSummary?.totalMissingQuestions || 0;
  const isQuestionBankShort = isFull && availableCount < requiredCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={localizePath(`/admin/exams/${examId}/mock-tests`, locale)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
              ExamPattern AI Mock Test Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Generate Mock Test
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate candidate-ready mock exams adhering strictly to official examination blueprints and verified syllabus rules.
          </p>
        </div>

        {versions.length > 1 && (
          <div className="shrink-0">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Cycle / Version</label>
            <select
              value={selectedVersionId}
              onChange={(e) => handleVersionSelect(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.versionName} ({v.year})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3 text-red-800 dark:text-red-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
          <div className="space-y-1">
            <strong className="block font-bold">Mock Generation Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 1. GENERATION TYPE SELECTION */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
            1. Select Generation Mode
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Choose whether to generate a full 100% pattern-aligned mock examination or a quick practice drill.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FULL PATTERN OPTION */}
            <div
              onClick={() => setGenerationType("FULL_PATTERN")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                generationType === "FULL_PATTERN"
                  ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="generationType"
                  checked={generationType === "FULL_PATTERN"}
                  onChange={() => setGenerationType("FULL_PATTERN")}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Full Pattern-Based Mock Test
                    </span>
                    <Badge variant="success" className="text-[10px] py-0 px-1.5 font-bold">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Generates a complete mock examination using the exact question count, sections, duration, marks, and distribution defined by the selected examination pattern.
                  </p>
                </div>
              </div>
            </div>

            {/* QUICK / PARTIAL OPTION */}
            <div
              onClick={() => setGenerationType("QUICK")}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                generationType === "QUICK"
                  ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="generationType"
                  checked={generationType === "QUICK"}
                  onChange={() => setGenerationType("QUICK")}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    Quick / Partial Mock Test
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Generates a shorter practice test proportional to the examination pattern with custom question count.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick options input if QUICK selected */}
          {generationType === "QUICK" && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Question Count:</span>
              <div className="flex items-center gap-2">
                {[15, 25, 50].map((count) => (
                  <Button
                    key={count}
                    type="button"
                    size="sm"
                    variant={quickQuestionCount === count ? "default" : "outline"}
                    onClick={() => setQuickQuestionCount(count)}
                    className="text-xs h-8 px-3"
                  >
                    {count} Questions
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. PATTERN SUMMARY (AUTHORITATIVE CONFIGURATION) */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> 2. Examination Pattern Summary
            </CardTitle>
            {patternSummary && (
              <Badge variant="outline" className="text-xs font-semibold">
                Pattern: {patternSummary.blueprintTitle}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-slate-500">
            Authoritative configuration loaded directly from the locked exam blueprint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Loading pattern configuration...
            </div>
          ) : !patternSummary ? (
            <div className="p-6 text-center text-amber-700 bg-amber-50 rounded-xl text-xs">
              No locked/verified blueprint found for this exam version. Please verify the blueprint first.
            </div>
          ) : (
            <>
              {/* Stat Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                    Total Questions
                  </span>
                  <strong className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                    {patternSummary.totalQuestions}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                    Exam Duration
                  </span>
                  <strong className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                    {patternSummary.durationMinutes}m
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                    Total Marks
                  </span>
                  <strong className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                    {patternSummary.totalMarks}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                    Negative Rate
                  </span>
                  <strong className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                    {patternSummary.negativeMarkingRate > 0 ? `-${patternSummary.negativeMarkingRate}` : "0"}
                  </strong>
                </div>
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Configured Sections Breakdown:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patternSummary.sections.map((sec) => (
                    <div
                      key={sec.sectionOrder}
                      className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          Section {sec.sectionOrder}: {sec.sectionName}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {sec.questionCount} Questions
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Marks/Q:</span>
                          <strong>{sec.marksPerQuestion}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Section Total:</span>
                          <strong>{sec.totalMarks} Marks</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Available Bank:</span>
                          <strong className={sec.availableQuestionsCount >= sec.questionCount ? "text-emerald-600" : "text-amber-600"}>
                            {sec.availableQuestionsCount} Qs
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUESTION AVAILABILITY & AI GENERATION TOGGLE */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Question Bank Status:
                    </span>
                    {patternSummary.isQuestionBankSufficient ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> All {availableCount} suitable questions available in bank
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> {availableCount} available / {requiredCount} required ({missingCount} missing)
                      </span>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateMissingWithAi}
                      onChange={(e) => setGenerateMissingWithAi(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Generate Missing Questions with AI</span>
                  </label>
                </div>

                {isQuestionBankShort && !generateMissingWithAi && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                    ⚠️ The question bank does not have enough questions to fulfill the complete pattern. Enable &ldquo;Generate Missing Questions with AI&rdquo; to complete the full pattern.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. CONFIRMATION & GENERATION ACTION */}
      <Card className="border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/30 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 shadow-md">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Mock Test Title (Optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={`e.g. ${patternSummary?.examName || "Exam"} Official Pattern Mock #1`}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Confirmation summary */}
          {patternSummary && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block text-sm">
                You are about to generate:
              </span>
              <p>
                <strong>{isFull ? patternSummary.totalQuestions : quickQuestionCount} Questions</strong> •{" "}
                <strong>{isFull ? patternSummary.durationMinutes : Math.max(15, Math.round(quickQuestionCount * 1.2))} Minutes</strong> •{" "}
                <strong>{patternSummary.sections.length} Sections</strong>
              </p>
              <div className="text-[11px] text-slate-500 pt-1 flex flex-wrap gap-x-4 gap-y-1">
                {patternSummary.sections.map((s) => (
                  <span key={s.sectionOrder}>
                    {s.sectionName}: <strong>{isFull ? s.questionCount : Math.max(1, Math.round((s.questionCount / patternSummary.totalQuestions) * quickQuestionCount))} Qs</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {isGenerating ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 border-2 border-emerald-600 border-r-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Generating Pattern-Based Mock Test...
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {generationStep || "Processing..."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Link href={localizePath(`/admin/exams/${examId}/mock-tests`, locale)}>
                <Button variant="outline" type="button" className="w-full sm:w-auto text-xs min-h-[44px]">
                  Cancel
                </Button>
              </Link>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!patternSummary || isGenerating || (isQuestionBankShort && !generateMissingWithAi)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm gap-2 shadow-sm min-h-[44px]"
              >
                <Zap className="h-4 w-4 text-amber-300" />
                {isFull ? "Generate Full Mock Test" : "Generate Quick Mock Test"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
