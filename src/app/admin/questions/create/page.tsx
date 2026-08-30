"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SyllabusTreeSelector, SyllabusSectionItem } from "@/components/admin/syllabus-tree-selector";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface ExamOption {
  id: string;
  name: string;
  versions: {
    id: string;
    versionName: string;
    year: number;
    syllabi: {
      id: string;
      title: string;
      sections: SyllabusSectionItem[];
    }[];
  }[];
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // Tab State
  const [mode, setMode] = useState<"MANUAL" | "AI_GENERATE">("MANUAL");

  // Manual Form State
  const [questionText, setQuestionText] = useState("");
  const [questionTextHindi, setQuestionTextHindi] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explanationHindi, setExplanationHindi] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [marks, setMarks] = useState(1.0);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [options, setOptions] = useState([
    { optionKey: "A", optionText: "", optionTextHindi: "", isCorrect: true },
    { optionKey: "B", optionText: "", optionTextHindi: "", isCorrect: false },
    { optionKey: "C", optionText: "", optionTextHindi: "", isCorrect: false },
    { optionKey: "D", optionText: "", optionTextHindi: "", isCorrect: false },
  ]);

  // AI Gen Form State
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/exams?pageSize=50");
        const data = await res.json();
        if (data.success && data.data?.items) {
          setExams(data.data.items);
          if (data.data.items.length > 0) {
            const firstExam = data.data.items[0];
            setSelectedExamId(firstExam.id);
            if (firstExam.versions?.length > 0) {
              const firstVer = firstExam.versions[0];
              setSelectedVersionId(firstVer.id);
              const allTopics = firstVer.syllabi?.[0]?.sections?.flatMap((s: SyllabusSectionItem) => s.topics.map((t) => t.id)) || [];
              if (allTopics.length > 0) {
                setSelectedTopicIds([allTopics[0]]);
              }
            }
          }
        }
      } catch {
        console.error("Failed to load exams");
      }
    }
    loadExams();
  }, []);

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const currentVersion = currentExam?.versions?.find((v) => v.id === selectedVersionId);
  const syllabusSections: SyllabusSectionItem[] = useMemo(() => {
    return currentVersion?.syllabi?.[0]?.sections || [];
  }, [currentVersion]);

  const allAvailableTopicIds = useMemo(() => {
    return syllabusSections.flatMap((s) => s.topics.map((t) => t.id));
  }, [syllabusSections]);

  // Synchronize selectedVersionId when currentExam changes
  useEffect(() => {
    if (currentExam?.versions && currentExam.versions.length > 0) {
      const exists = currentExam.versions.some((v) => v.id === selectedVersionId);
      if (!exists) {
        setSelectedVersionId(currentExam.versions[0].id);
      }
    } else {
      setSelectedVersionId("");
    }
  }, [currentExam, selectedVersionId]);

  // Synchronize selectedTopicIds when version topics change
  useEffect(() => {
    if (allAvailableTopicIds.length > 0) {
      const validSelected = selectedTopicIds.filter((id) => allAvailableTopicIds.includes(id));
      if (validSelected.length === 0) {
        setSelectedTopicIds([allAvailableTopicIds[0]]);
      } else if (validSelected.length !== selectedTopicIds.length) {
        setSelectedTopicIds(validSelected);
      }
    } else {
      setSelectedTopicIds([]);
    }
  }, [allAvailableTopicIds, selectedTopicIds]);

  const handleOptionChange = (idx: number, field: "optionText" | "optionTextHindi", val: string) => {
    const updated = [...options];
    updated[idx][field] = val;
    setOptions(updated);
  };

  const handleSetCorrect = (idx: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx,
    }));
    setOptions(updated);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTopicIds.length === 0) {
      setMessage({ text: "Please select at least one syllabus topic from the syllabus tree.", type: "error" });
      return;
    }

    if (!questionText.trim()) {
      setMessage({ text: "Question text is required.", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const primaryTopicId = selectedTopicIds[0];
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: primaryTopicId,
          topicIds: selectedTopicIds,
          questionType: "SINGLE_CHOICE",
          difficulty,
          status: "APPROVED",
          questionText: questionText.trim(),
          questionTextHindi: questionTextHindi.trim() || undefined,
          explanation: explanation.trim() || undefined,
          explanationHindi: explanationHindi.trim() || undefined,
          marks,
          negativeMarks,
          source: "MANUAL",
          options: options.map((o) => ({
            optionKey: o.optionKey,
            optionText: o.optionText.trim(),
            optionTextHindi: o.optionTextHindi.trim() || undefined,
            isCorrect: o.isCorrect,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Failed to create question", type: "error" });
        setIsLoading(false);
        return;
      }

      // Successful creation redirect to question list with success parameter
      router.push(localizePath("/admin/questions?success=created", locale));
      router.refresh();
    } catch {
      setMessage({ text: "Network error creating question", type: "error" });
      setIsLoading(false);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || selectedTopicIds.length === 0) {
      setMessage({
        text: "Please select an Exam Version and at least one Syllabus Topic.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examVersionId: selectedVersionId,
          topicIds: selectedTopicIds,
          count: aiCount,
          difficulty: aiDifficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "AI question generation failed", type: "error" });
        setIsLoading(false);
        return;
      }

      // Successful generation redirect to question list with query parameters
      const countGenerated = data.data?.generatedCount || aiCount;
      router.push(localizePath(`/admin/questions?success=generated&count=${countGenerated}`, locale));
      router.refresh();
    } catch {
      setMessage({ text: "Network error during AI question generation", type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button href="/admin/questions" variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> Back to Question Bank
        </Button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setMode("MANUAL")}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
            mode === "MANUAL"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Plus className="h-4 w-4" /> Manual Question Entry
        </button>
        <button
          type="button"
          onClick={() => setMode("AI_GENERATE")}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
            mode === "AI_GENERATE"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-300" /> AI Question Generator (Gemini)
        </button>
      </div>

      {message && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Syllabus Topic Binding Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">1. Examination & Syllabus Scope Selection</CardTitle>
          <CardDescription className="text-xs">
            Select the target exam, notification cycle, and one or more syllabus sections/topics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="examSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Exam
              </label>
              <select
                id="examSelect"
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  const ex = exams.find((x) => x.id === e.target.value);
                  if (ex?.versions?.length) {
                    setSelectedVersionId(ex.versions[0].id);
                  }
                }}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="verSelect" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Cycle / Version
              </label>
              <select
                id="verSelect"
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {currentExam?.versions?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionName} ({v.year})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hierarchical Syllabus Tree Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Verified Syllabus Tree (Select All / Specific Sections & Topics)
            </label>
            <SyllabusTreeSelector
              sections={syllabusSections}
              selectedTopicIds={selectedTopicIds}
              onChange={setSelectedTopicIds}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Section */}
      {mode === "MANUAL" && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">2. Question Content & Translations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Stem (English) *
                </label>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the authoritative question statement in English..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Stem (Hindi Translation - Optional)
                </label>
                <textarea
                  rows={2}
                  value={questionTextHindi}
                  onChange={(e) => setQuestionTextHindi(e.target.value)}
                  placeholder="प्रश्न विवरण हिंदी में दर्ज करें..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Marks Awarded</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={marks}
                    onChange={(e) => setMarks(parseFloat(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Negative Deduction</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(parseFloat(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">3. Answer Choices & Correct Key</CardTitle>
              <CardDescription className="text-xs">
                Select the radio button corresponding to the correct answer choice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.map((opt, idx) => (
                <div
                  key={opt.optionKey}
                  className={`p-3 rounded-xl border transition-all ${
                    opt.isCorrect
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500"
                      : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => handleSetCorrect(idx)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                      aria-label={`Option ${opt.optionKey} is correct`}
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {opt.optionKey}.
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                      <input
                        type="text"
                        value={opt.optionText}
                        onChange={(e) => handleOptionChange(idx, "optionText", e.target.value)}
                        placeholder={`Option ${opt.optionKey} in English...`}
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        required
                      />
                      <input
                        type="text"
                        value={opt.optionTextHindi}
                        onChange={(e) => handleOptionChange(idx, "optionTextHindi", e.target.value)}
                        placeholder={`विकल्प ${opt.optionKey} हिंदी में...`}
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Explanation Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">4. Explanations & Rationale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation (English)
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide step-by-step solution and official rationale..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation (Hindi)
                </label>
                <textarea
                  rows={2}
                  value={explanationHindi}
                  onChange={(e) => setExplanationHindi(e.target.value)}
                  placeholder="समाधान और व्याख्या हिंदी में..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-sm min-h-[44px]"
              >
                {isLoading ? "Saving Question..." : "Save Question to Bank"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* AI Question Generator Section */}
      {mode === "AI_GENERATE" && (
        <form onSubmit={handleAiGenerate} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                2. AI Generation Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Gemini will generate authentic questions strictly bounded to the selected syllabus topics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Question Count
                  </label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={30}>30 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Balance
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium (Balanced)</option>
                    <option value="HARD">Hard (Advanced Revision)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> AI Scope Control Active:
                </div>
                <p>
                  Questions will be generated exclusively within the <strong>{selectedTopicIds.length}</strong> selected syllabus topics.
                  Every generated item is verified against duplicate content and blueprint negative marking standards.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                type="submit"
                disabled={isLoading || selectedTopicIds.length === 0}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-sm min-h-[44px] gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                    <span>Generating & Validating Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate & Add to Question Bank ({aiCount} Qs)</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}
