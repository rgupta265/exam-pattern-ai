"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExamOption {
  id: string;
  name: string;
  category: string;
  topics: { id: string; name: string }[];
}

interface QuestionOptionItem {
  key: string;
  text: string;
  textHindi?: string | null;
  isCorrect: boolean;
}

interface GeneratedQuestionItem {
  questionText: string;
  questionTextHindi?: string | null;
  questionType: string;
  options: QuestionOptionItem[];
  correctAnswer: string;
  explanation: string;
  explanationHindi?: string | null;
  difficulty: string;
  topicName?: string | null;
  sourceType?: string | null;
  generationMode?: string | null;
  sourceTextSnippet?: string | null;
}

interface GenerationResultData {
  questions: GeneratedQuestionItem[];
  extractedContent?: {
    sourceType: string;
    wordCount: number;
    preview: string;
  };
}

export default function AdminAiGenerationWorkspacePage() {
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sourceType, setSourceType] = useState<"FILE" | "TEXT">("FILE");
  const [generationMode, setGenerationMode] = useState<"SOURCE_ONLY" | "EXAM_CONTEXT_ASSISTED">(
    "SOURCE_ONLY"
  );
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [questionCount, setQuestionCount] = useState(5);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResultData | null>(null);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/exams");
        const json = await res.json();
        if (json.success && json.data?.items) {
          const mapped = json.data.items.map((ex: { id: string; name: string; category?: { name: string }; versions?: { syllabi?: { sections?: { topics?: { id: string; name: string }[] }[] }[] }[] }) => ({
            id: ex.id,
            name: ex.name,
            category: ex.category?.name || "General",
            topics: ex.versions?.[0]?.syllabi?.[0]?.sections?.flatMap((s) => s.topics || []) || [],
          }));
          setExams(mapped);
          if (mapped.length > 0) {
            setSelectedExamId(mapped[0].id);
            if (mapped[0].topics.length > 0) {
              setSelectedTopic(mapped[0].topics[0].name);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load exams", err);
      }
    }
    loadExams();
  }, []);

  const handleExamChange = (id: string) => {
    setSelectedExamId(id);
    const selected = exams.find((e) => e.id === id);
    if (selected && selected.topics.length > 0) {
      setSelectedTopic(selected.topics[0].name);
    } else {
      setSelectedTopic("");
    }
  };

  const handleGenerate = async () => {
    if (!selectedExamId || !selectedTopic) {
      setError("Please select an Exam and Target Topic.");
      return;
    }

    if (sourceType === "FILE" && !file) {
      setError("Please choose a source file (PDF, DOCX, or Image).");
      return;
    }

    if (sourceType === "TEXT" && rawText.trim().length < 20) {
      setError("Please enter at least 20 characters of source text.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res;
      if (sourceType === "FILE" && file) {
        const formData = new FormData();
        formData.append("examId", selectedExamId);
        formData.append("topicName", selectedTopic);
        formData.append("difficulty", difficulty);
        formData.append("questionCount", questionCount.toString());
        formData.append("generationMode", generationMode);
        formData.append("file", file);

        res = await fetch("/api/ai/generate-from-source", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/ai/generate-from-source", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId: selectedExamId,
            topicName: selectedTopic,
            difficulty,
            questionCount,
            generationMode,
            rawText,
          }),
        });
      }

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error?.message || "AI question generation failed.");
      }
    } catch {
      setError("Network error communicating with AI server.");
    } finally {
      setLoading(false);
    }
  };

  const currentExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
            Source-Based AI Engine
          </span>
          <span className="text-xs font-semibold text-slate-500">PDF • DOCX • Image • Text</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Source Material AI Question Generator
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Synthesize authentic questions from notes, papers, and textbooks strictly bounded by verified exam syllabus topics.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-3 text-red-800 dark:text-red-300 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Generation Parameters & Source Upload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam & Topic Selection Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" /> 1. Select Examination Scope
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Exam
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => handleExamChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold min-h-[44px]"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Verified Syllabus Topic
                </label>
                {currentExam && currentExam.topics.length > 0 ? (
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold min-h-[44px]"
                  >
                    {currentExam.topics.map((top) => (
                      <option key={top.id} value={top.name}>
                        {top.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    placeholder="Enter topic name..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold min-h-[44px]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Source Material Input Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" /> 2. Provide Source Material
              </h2>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSourceType("FILE")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    sourceType === "FILE" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType("TEXT")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    sourceType === "TEXT" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  Plain Text
                </button>
              </div>
            </div>

            {sourceType === "FILE" ? (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 transition-all cursor-pointer">
                <input
                  type="file"
                  id="source-file-input"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="source-file-input" className="cursor-pointer block space-y-2">
                  <div className="flex justify-center gap-2 text-slate-400">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <FileSpreadsheet className="h-8 w-8 text-indigo-500" />
                    <ImageIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {file ? file.name : "Click to upload PDF, DOCX, or Scanned Image"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {file ? `${(file.size / 1024).toFixed(1)} KB selected` : "Max file size: 25 MB"}
                  </p>
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Paste Study Notes / Content
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste textbook excerpts, notifications, or lecture summaries here..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-right text-[11px] text-slate-400 mt-1">
                  {rawText.length} characters
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: AI Configuration & Mode */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> 3. Generation Control
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                AI Generation Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={generationMode === "SOURCE_ONLY"}
                    onChange={() => setGenerationMode("SOURCE_ONLY")}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Source-Only Mode
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Strictly bound to uploaded document. No outside knowledge used.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={generationMode === "EXAM_CONTEXT_ASSISTED"}
                    onChange={() => setGenerationMode("EXAM_CONTEXT_ASSISTED")}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Exam-Context Assisted Mode
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Synthesizes source material with verified exam blueprint rules.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold min-h-[40px]"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Question Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold min-h-[40px]"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm min-h-[46px] gap-2 shadow-md cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                    <span>Extracting & Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Bilingual Questions</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Display Section */}
      {result && (
        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              Generated Questions ({result.questions?.length || 0})
            </h2>
            <Badge variant="outline" className="text-xs font-bold text-blue-600">
              Source: {result.extractedContent?.sourceType} ({result.extractedContent?.wordCount} words)
            </Badge>
          </div>

          <div className="space-y-4">
            {result.questions?.map((q, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <Badge variant="secondary" className="text-xs font-bold">
                      {q.difficulty}
                    </Badge>
                    <span className="text-xs text-slate-500 font-semibold">{q.topicName}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Mode: {q.generationMode}
                  </span>
                </div>

                {/* English Stem */}
                <p className="font-bold text-slate-900 dark:text-white text-base">{q.questionText}</p>

                {/* Hindi Stem */}
                {q.questionTextHindi && (
                  <p className="font-medium text-slate-700 dark:text-slate-300 text-sm pt-1 border-t border-slate-100 dark:border-slate-800">
                    {q.questionTextHindi}
                  </p>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {q.options?.map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
                        opt.isCorrect
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="font-bold shrink-0">{opt.key}.</span>
                      <div className="space-y-0.5">
                        <div>{opt.text}</div>
                        {opt.textHindi && (
                          <div className="text-slate-500 dark:text-slate-400 text-xs">
                            {opt.textHindi}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs space-y-1">
                  <div className="font-bold text-blue-900 dark:text-blue-300">Rationale & Explanation:</div>
                  <div className="text-slate-700 dark:text-slate-300">{q.explanation}</div>
                  {q.explanationHindi && (
                    <div className="text-slate-600 dark:text-slate-400 pt-1 border-t border-blue-100 dark:border-blue-900">
                      {q.explanationHindi}
                    </div>
                  )}
                </div>

                {/* Source Traceability Footer */}
                {q.sourceTextSnippet && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Source Trace: &quot;{q.sourceTextSnippet}&quot;</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
