"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  FileText,
  Clock,
  Award,
  AlertTriangle,
  Globe,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";
import { useLoading } from "@/components/common/loading-overlay";

interface InstructionData {
  attemptId: string;
  mockId: string;
  mockCode: string;
  mockTitle: string;
  examName: string;
  authority: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeRate: number;
  language: string;
  instructions: string | null;
  instructionsHindi: string | null;
  isAcknowledged: boolean;
  instructionsLanguage: string;
}

export default function ExamInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const attemptId = params?.attemptId as string;

  const [data, setData] = useState<InstructionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<"en" | "hi">("en");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { withLoading } = useLoading();

  useEffect(() => {
    async function loadInstructions() {
      try {
        const res = await fetch(`/api/candidate/attempts/${attemptId}/instructions`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          if (json.data.instructionsLanguage === "HINDI") {
            setSelectedLang("hi");
          }
          if (json.data.isAcknowledged) {
            setAcknowledged(true);
          }
        } else {
          setError(json.error?.message || "Failed to load examination instructions.");
        }
      } catch {
        setError("Network error loading instructions.");
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadInstructions();
    }
  }, [attemptId]);

  const handleStartExam = async () => {
    if (!acknowledged) return;
    setSubmitting(true);
    await withLoading(async () => {
      try {
        const res = await fetch(`/api/candidate/attempts/${attemptId}/instructions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: selectedLang === "hi" ? "HINDI" : "ENGLISH",
          }),
        });
        const json = await res.json();
        if (json.success) {
          router.push(localizePath(`/candidate/attempts/${attemptId}`, locale));
        } else {
          setError(json.error?.message || "Could not start examination.");
          setSubmitting(false);
        }
      } catch {
        setError("Network error starting exam.");
        setSubmitting(false);
      }
    }, "Preparing your examination room...");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-sm w-full text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-3" />
          <p className="text-slate-600 text-sm font-medium">Loading Official Instructions...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-xs max-w-md w-full text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Instructions Error</h2>
          <p className="text-slate-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push(localizePath("/candidate/mock-tests", locale))}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold min-h-[44px]"
          >
            Back to Mock Tests
          </button>
        </div>
      </div>
    );
  }

  const isHindi = selectedLang === "hi";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                  {data.mockCode}
                </span>
                <span className="text-xs font-semibold text-slate-500">{data.authority}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {data.examName}
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                {data.mockTitle}
              </p>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
              <Globe className="h-4 w-4 text-slate-500 ml-1" />
              <button
                type="button"
                onClick={() => setSelectedLang("en")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  !isHindi
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang("hi")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  isHindi
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <FileText className="h-4 w-4 text-blue-600" />
                {isHindi ? "कुल प्रश्न" : "Total Questions"}
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {data.totalQuestions}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                {isHindi ? "कुल समय" : "Duration"}
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {data.durationMinutes} {isHindi ? "मिनट" : "Mins"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Award className="h-4 w-4 text-emerald-600" />
                {isHindi ? "कुल पूर्णांक" : "Total Marks"}
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{data.totalMarks}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                {isHindi ? "नकारात्मक अंकन" : "Negative Marking"}
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {data.negativeRate > 0 ? `-${data.negativeRate}` : isHindi ? "शून्य" : "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions Body */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isHindi ? "सामान्य परीक्षा निर्देश" : "General Examination Instructions"}
            </h2>
          </div>

          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {/* Section 1 */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                {isHindi ? "समय प्रबंधन एवं घड़ी" : "Clock & Time Management"}
              </h3>
              <p className="ml-7 text-slate-600 dark:text-slate-400">
                {isHindi
                  ? `सर्वर पर आपकी परीक्षा का समय शुरू होगा। स्क्रीन के शीर्ष पर स्थित उल्टी गिनती का टाइमर (Countdown Timer) शेष समय प्रदर्शित करेगा। ${data.durationMinutes} मिनट पूरे होने पर परीक्षा स्वतः सबमिट (Auto-Submit) हो जाएगी।`
                  : `The server clock will manage your session. A countdown timer at the top of your screen will display the remaining time. The examination will automatically submit when ${data.durationMinutes} minutes expire.`}
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                {isHindi ? "प्रश्न पैलेट संकेत (Palette Symbols)" : "Question Palette Symbols"}
              </h3>
              <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="h-6 w-6 rounded-md bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ✓
                  </span>
                  <span className="text-xs font-medium">
                    {isHindi ? "हरा: आपने प्रश्न का उत्तर दे दिया है" : "Green: You have answered the question"}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="h-6 w-6 rounded-md bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ✗
                  </span>
                  <span className="text-xs font-medium">
                    {isHindi ? "लाल: आपने प्रश्न का उत्तर नहीं दिया है" : "Red: You have not answered the question"}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="h-6 w-6 rounded-md bg-purple-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ★
                  </span>
                  <span className="text-xs font-medium">
                    {isHindi
                      ? "बैंगनी: समीक्षा के लिए चिह्नित (Marked for Review)"
                      : "Purple: Marked for Review"}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="h-6 w-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    ○
                  </span>
                  <span className="text-xs font-medium">
                    {isHindi ? "धूसर: आपने अभी तक प्रश्न नहीं देखा" : "Grey: You have not visited the question"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                {isHindi ? "नेविगेशन एवं उत्तर सहेजना" : "Navigating & Autosaving Answers"}
              </h3>
              <p className="ml-7 text-slate-600 dark:text-slate-400">
                {isHindi
                  ? "विकल्प का चयन करते ही आपका उत्तर पृष्ठभूमि में स्वचालित रूप से सहेज लिया जाता है। आप 'उत्तर साफ़ करें' (Clear Response) पर क्लिक करके अपना चुना हुआ विकल्प हटा सकते हैं।"
                  : "Every answer selection is securely autosaved to the server in real time. You can change your choice anytime before final submission or clear it using 'Clear Answer'."}
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                {isHindi ? "अंक योजना एवं नकारात्मक अंकन" : "Marking Scheme"}
              </h3>
              <p className="ml-7 text-slate-600 dark:text-slate-400">
                {isHindi
                  ? `प्रत्येक सही उत्तर के लिए अंक प्रदान किए जाएंगे। प्रत्येक गलत उत्तर के लिए -${data.negativeRate} अंक काटे जाएंगे। बिना हल किए गए प्रश्नों के लिए कोई अंक नहीं काटा जाएगा।`
                  : `Each correct answer awards positive marks. Each incorrect answer incurs a deduction of -${data.negativeRate} marks. Unattempted questions carry zero penalty.`}
              </p>
            </div>
          </div>

          {/* Declaration Checkbox */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                {isHindi
                  ? "मैंने सभी निर्देशों को ध्यानपूर्वक पढ़ और समझ लिया है। मैं प्रमाणित करता/करती हूँ कि मैं परीक्षा निष्पक्षता एवं नियमों का पूर्ण पालन करूँगा/करूँगी।"
                  : "I have read and understood all the examination instructions above. I declare that I will adhere strictly to the examination regulations."}
              </span>
            </label>
          </div>

          {/* Start Test CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <HelpCircle className="h-4 w-4" />
              <span>
                {isHindi ? "परीक्षा के दौरान सहायता उपलब्ध रहेगी" : "Timer begins immediately upon clicking start"}
              </span>
            </div>

            <button
              type="button"
              disabled={!acknowledged || submitting}
              onClick={handleStartExam}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2.5 transition-all shadow-md min-h-[48px] ${
                acknowledged && !submitting
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-500/20 active:scale-98"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-r-transparent rounded-full animate-spin" />
                  <span>{isHindi ? "शुरू हो रहा है..." : "Initializing Exam Room..."}</span>
                </>
              ) : (
                <>
                  <span>{isHindi ? "मैं परीक्षा शुरू करने के लिए तैयार हूँ" : "I am Ready to Begin"}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
