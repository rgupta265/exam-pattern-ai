"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  AlertTriangle,
  FileText,
  Clock,
  Award,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExamVersionReadinessReport } from "@/services/document/document-readiness.service";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface AISuggestion {
  id: string;
  title: string;
  titleHindi?: string;
  description: string;
  mockType: string;
  examId: string;
  examVersionId: string;
  topicId?: string;
  topicName?: string;
  difficulty: string;
  questionCount: number;
  durationMinutes: number;
  action: string;
}

interface VersionOption {
  id: string;
  versionName: string;
  year: number;
  notificationNumber?: string | null;
}

export default function CreateMockTestWizardPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const examId = params?.examId as string;

  const [versions, setVersions] = useState<VersionOption[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [readiness, setReadiness] = useState<ExamVersionReadinessReport | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingActual, setIsGeneratingActual] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReadiness = useCallback(async (versionId: string) => {
    if (!versionId) return;
    try {
      const res = await fetch(`/api/documents/readiness/${versionId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReadiness(json.data);
      }
    } catch {
      console.error("Failed to load readiness");
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [verRes, sugRes] = await Promise.all([
        fetch(`/api/exams/${examId}/versions`),
        fetch(`/api/ai/suggestions?examId=${examId}`),
      ]);

      const verJson = await verRes.json();
      const sugJson = await sugRes.json();

      if (verJson.success && verJson.data?.versions?.length > 0) {
        setVersions(verJson.data.versions);
        const firstVer = verJson.data.versions[0];
        setSelectedVersionId(firstVer.id);
        loadReadiness(firstVer.id);
      }

      if (sugJson.success) {
        setSuggestions(sugJson.data?.suggestions || []);
      }
    } catch {
      setError("Network error fetching exam details.");
    } finally {
      setLoading(false);
    }
  }, [examId, loadReadiness]);

  useEffect(() => {
    if (examId) loadData();
  }, [examId, loadData]);

  const handleVersionSelect = (verId: string) => {
    setSelectedVersionId(verId);
    loadReadiness(verId);
  };

  // ONE-CLICK ACTUAL PATTERN MOCK GENERATION
  const handleGenerateActualPattern = async () => {
    if (!selectedVersionId) return;
    setIsGeneratingActual(true);
    setError(null);
    setGenerationStep("Preparing exam version context & verifying documents...");

    try {
      setGenerationStep("Analyzing locked blueprint & calculating exact section distribution...");

      const res = await fetch("/api/mock-tests/generate-actual-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examVersionId: selectedVersionId,
        }),
      });

      setGenerationStep("Validating question patterns and 100% blueprint compliance...");

      const json = await res.json();
      if (json.success && json.data?.mockTest?.id) {
        setGenerationStep("Completed! Redirecting to published mock...");
        router.push(localizePath(`/admin/mock-tests/${json.data.mockTest.id}`, locale));
      } else {
        setError(json.error?.message || "Actual pattern mock generation failed.");
        setIsGeneratingActual(false);
        setGenerationStep("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error during mock generation.");
      setIsGeneratingActual(false);
      setGenerationStep("");
    }
  };

  const handleGenerateSuggestion = async (sug: AISuggestion) => {
    setGeneratingId(sug.id);
    setError(null);

    try {
      if (sug.mockType === "FULL_MOCK") {
        const res = await fetch("/api/mock-tests/generate-actual-pattern", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examVersionId: sug.examVersionId,
            customTitle: sug.title,
          }),
        });
        const json = await res.json();
        if (json.success && json.data?.mockTest?.id) {
          router.push(localizePath(`/admin/mock-tests/${json.data.mockTest.id}`, locale));
        } else {
          setError(json.error?.message || "Generation failed");
          setGeneratingId(null);
        }
      } else {
        const res = await fetch("/api/mock-tests/generate-topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examVersionId: sug.examVersionId,
            topicId: sug.topicId,
            title: sug.title,
            difficulty: sug.difficulty,
            questionCount: sug.questionCount,
          }),
        });
        const json = await res.json();
        if (json.success && json.data?.id) {
          router.push(localizePath(`/admin/mock-tests/${json.data.id}`, locale));
        } else {
          setError(json.error?.message || "Topic drill generation failed");
          setGeneratingId(null);
        }
      }
    } catch {
      setError("Network error during mock generation.");
      setGeneratingId(null);
    }
  };

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
              Phase 8 Actual-Pattern Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Generate Official-Pattern Mock Test
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate 100% blueprint-compliant mock tests with authoritative section distribution and verified context.
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
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-3 text-red-800 dark:text-red-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FEATURE 1: ONE-CLICK ACTUAL PATTERN MOCK GENERATION CARD */}
      <Card className="border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                  One-Click Actual-Pattern Mock Test
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Generates a complete mock test strictly matching the official locked blueprint distribution.
              </CardDescription>
            </div>

            <Badge
              variant={readiness?.isReadyForMockGeneration ? "success" : "warning"}
              className="text-xs font-bold uppercase tracking-wider py-1 px-3 self-start md:self-auto"
            >
              {readiness?.isReadyForMockGeneration ? "✓ READY FOR GENERATION" : "MISSING PREREQUISITES"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {readiness && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold block text-[11px]">Exam Blueprint</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {readiness.blueprintReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {readiness.blueprintReady ? `${readiness.blueprintDetails?.totalQuestions} Questions` : "Not Locked"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {readiness.blueprintDetails ? `${readiness.blueprintDetails.sectionsCount} Sections • ${readiness.blueprintDetails.durationMinutes}m` : "Required"}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold block text-[11px]">Official Documents</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {readiness.missingRequiredDocuments.length === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {readiness.missingRequiredDocuments.length === 0 ? "All Required Verified" : `${readiness.missingRequiredDocuments.length} Missing`}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {readiness.requiredChecklist.filter((r) => r.isVerified).length}/{readiness.requiredChecklist.length} Verified
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold block text-[11px]">Verified Syllabus</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {readiness.syllabusReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {readiness.syllabusReady ? `${readiness.syllabusDetails?.topicsCount} Topics` : "Not Verified"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {readiness.syllabusDetails?.sectionsCount || 0} Sections Active
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold block text-[11px]">Guarantee Standard</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-slate-900 dark:text-white">100% Pattern Match</span>
                </div>
                <span className="text-[10px] text-slate-400">Automated Audit & Zod Gate</span>
              </div>
            </div>
          )}

          {isGeneratingActual ? (
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 border-3 border-emerald-600 border-r-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Generating Actual-Pattern Mock Test...
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {generationStep || "Processing..."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {readiness?.isReadyForMockGeneration ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Ready! Click below to generate an official actual-pattern mock test.
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    Please upload and verify all required documents under{" "}
                    <Link href={`/admin/exams/${examId}/documents`} className="underline font-bold">
                      Exam Documents
                    </Link>{" "}
                    before generation.
                  </span>
                )}
              </div>

              <Button
                type="button"
                onClick={handleGenerateActualPattern}
                disabled={!readiness?.isReadyForMockGeneration || isGeneratingActual}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm gap-2 shadow-sm min-h-[44px]"
              >
                <Zap className="h-4 w-4 text-amber-300" />
                Generate Actual Pattern Mock
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contextual AI Suggestions Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Contextual AI Practice Suggestions
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Analyzing exam blueprint & verified syllabus...
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            No suggestions available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((sug) => {
              const isGen = generatingId === sug.id;

              return (
                <div
                  key={sug.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                        {sug.mockType}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {sug.difficulty}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {sug.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {sug.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-blue-600" /> {sug.questionCount} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-600" /> {sug.durationMinutes}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-emerald-600" /> 100% Pattern Match
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4">
                    <Button
                      type="button"
                      disabled={generatingId !== null || isGeneratingActual}
                      onClick={() => handleGenerateSuggestion(sug)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm min-h-[44px] gap-2 cursor-pointer shadow-xs"
                    >
                      {isGen ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                          <span>Generating Questions...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 text-amber-300" />
                          <span>Generate This Mock</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alternative Options */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Have Specific Source Documents or Notes?</h3>
          <p className="text-xs text-slate-300 mt-1">
            Generate custom questions directly from uploaded PDF/DOCX or study notes with source traceability.
          </p>
        </div>
        <Link
          href={`/admin/ai-generation`}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shrink-0 min-h-[44px] flex items-center gap-2"
        >
          <Layers className="h-4 w-4" /> Open AI Generation Workspace
        </Link>
      </div>
    </div>
  );
}
