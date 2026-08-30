"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  FileText,
  Globe,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

type PracticeSourceTab = "DOCUMENT" | "TEXT" | "URL";

export default function CandidateCreatePracticePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const [activeTab, setActiveTab] = useState<PracticeSourceTab>("DOCUMENT");
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [language, setLanguage] = useState<string>("English");
  const [generationMode, setGenerationMode] = useState<"SOURCE_ONLY" | "EXAM_CONTEXT_ASSISTED">("SOURCE_ONLY");

  // Source States
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState<{ title: string; wordCount: number; preview: string } | null>(null);
  const [isTestingUrl, setIsTestingUrl] = useState(false);

  // Submission State
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepMessage, setStepMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // URL Extraction Preview Handler
  const handleTestUrl = async () => {
    if (!url || !url.startsWith("http")) {
      setError("Please enter a valid HTTP/HTTPS URL.");
      return;
    }

    setError(null);
    setIsTestingUrl(true);
    setUrlPreview(null);

    try {
      const res = await fetch("/api/url-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to extract content from URL.");
        setIsTestingUrl(false);
        return;
      }

      setUrlPreview(json.data);
      if (!title) setTitle(`${json.data.title} Practice`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error validating URL.");
    } finally {
      setIsTestingUrl(false);
    }
  };

  // Main Generation Handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    setStepMessage("Preparing study resource...");

    try {
      let resourceId: string | undefined = undefined;

      // 1. Process Resource
      if (activeTab === "DOCUMENT") {
        if (!file) {
          setError("Please select a document file to upload.");
          setIsGenerating(false);
          return;
        }

        setStepMessage("Uploading & extracting text from document...");
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/candidate/practice/resources", {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          setError(uploadJson.error?.message || "Failed to process document.");
          setIsGenerating(false);
          return;
        }

        resourceId = uploadJson.data.resource.id;
      } else if (activeTab === "TEXT") {
        if (!text || text.trim().length < 20) {
          setError("Please paste at least 20 characters of study notes text.");
          setIsGenerating(false);
          return;
        }

        setStepMessage("Processing notes text...");
        const textRes = await fetch("/api/candidate/practice/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || "Study Notes Practice",
            text: text.trim(),
          }),
        });

        const textJson = await textRes.json();
        if (!textRes.ok || !textJson.success) {
          setError(textJson.error?.message || "Failed to save notes text.");
          setIsGenerating(false);
          return;
        }

        resourceId = textJson.data.resource.id;
      } else if (activeTab === "URL") {
        if (!url || !url.startsWith("http")) {
          setError("Please provide a valid web URL.");
          setIsGenerating(false);
          return;
        }

        setStepMessage("Fetching and analyzing web page with SSRF security...");
        const urlRes = await fetch("/api/candidate/practice/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const urlJson = await urlRes.json();
        if (!urlRes.ok || !urlJson.success) {
          setError(urlJson.error?.message || "Failed to process URL.");
          setIsGenerating(false);
          return;
        }

        resourceId = urlJson.data.resource.id;
      }

      // 2. Generate Practice Test with AI
      setStepMessage(`Generating ${questionCount} ${difficulty} practice questions with Gemini AI...`);

      const genRes = await fetch("/api/candidate/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          title: title.trim() || undefined,
          questionCount,
          difficulty,
          language,
          generationMode,
        }),
      });

      const genJson = await genRes.json();
      if (!genRes.ok || !genJson.success) {
        setError(genJson.error?.message || "Failed to generate practice test.");
        setIsGenerating(false);
        return;
      }

      setStepMessage("Practice drill ready! Redirecting...");
      router.push(localizePath(`/candidate/practice/${genJson.data.id}`, locale));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={localizePath("/candidate/practice", locale)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Practice Drills
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Multi-Source Practice Generator
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Create Custom Practice Drill
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Generate tailored questions from your PDFs, notes, or study links. Private & completely separate from official mock test analytics.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-3 text-red-800 dark:text-red-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleGenerate}>
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold">1. Select Study Material Source</CardTitle>
            <CardDescription className="text-xs">
              Choose how you want to supply your study content for practice question generation.
            </CardDescription>

            {/* Source Tab Selector */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("DOCUMENT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  activeTab === "DOCUMENT"
                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("TEXT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  activeTab === "TEXT"
                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>Paste Notes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("URL")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  activeTab === "URL"
                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span>Web URL</span>
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {/* Tab 1: Document Upload */}
            {activeTab === "DOCUMENT" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Document File (PDF, DOCX, PNG, JPG — max 25MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setFile(f);
                      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="flex h-11 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                {file && (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            )}

            {/* Tab 2: Textarea */}
            {activeTab === "TEXT" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paste Study Notes / Revision Material
                </label>
                <textarea
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your study notes, revision summaries, key facts, or clinical guidelines here (min 20 characters)..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{text.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{text.length} / 500,000 characters</span>
                </div>
              </div>
            )}

            {/* Tab 3: Web URL */}
            {activeTab === "URL" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Public Study Web URL (HTTP / HTTPS)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/study-notes-article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestUrl}
                    disabled={isTestingUrl || !url}
                    isLoading={isTestingUrl}
                    className="shrink-0 font-semibold min-h-[44px]"
                  >
                    Preview URL
                  </Button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Protected by SSRF security gateway. Localhost and private network addresses are blocked.</span>
                </div>

                {urlPreview && (
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> URL Validated: {urlPreview.title}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {urlPreview.preview}
                    </p>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                      {urlPreview.wordCount} words extracted
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Drill Title */}
            <div className="pt-2">
              <Input
                label="Practice Drill Title (Optional)"
                placeholder="e.g. Cardiovascular Pharmacology Chapter 4 Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Drill Configuration Parameters */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                2. Practice Drill Criteria
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Question Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 Questions (Quick)</option>
                    <option value={10}>10 Questions (Standard)</option>
                    <option value={20}>20 Questions (In-depth)</option>
                    <option value={30}>30 Questions (Thorough)</option>
                    <option value={50}>50 Questions (Full Drill)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Target Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EASY">Easy (Foundational)</option>
                    <option value="MEDIUM">Medium (Competitive)</option>
                    <option value="HARD">Hard (Advanced Clinical)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">हिंदी (Hindi)</option>
                    <option value="Bilingual">Bilingual (English + Hindi)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    AI Generation Mode
                  </label>
                  <select
                    value={generationMode}
                    onChange={(e) => setGenerationMode(e.target.value as "SOURCE_ONLY" | "EXAM_CONTEXT_ASSISTED")}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SOURCE_ONLY">Source-Only (Strictly In Material)</option>
                    <option value="EXAM_CONTEXT_ASSISTED">Context-Assisted (Synthesized)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status Feedback */}
            {isGenerating && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                <div className="h-5 w-5 border-2 border-blue-600 border-r-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">{stepMessage}</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-[11px] text-slate-500">
              ⚡ Guaranteed private storage & isolated practice results
            </span>

            <Button
              type="submit"
              disabled={isGenerating}
              isLoading={isGenerating}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-extrabold px-6 py-2.5 rounded-xl min-h-[44px] gap-2"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              Generate Practice Drill
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
