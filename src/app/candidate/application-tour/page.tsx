"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  GraduationCap,
  FileCheck,
  Award,
  Sparkles,
  RotateCcw,
  Video,
  CheckCircle2,
  FileText,
  Clock,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath } from "@/lib/i18n";

interface ActiveVideoData {
  id: string;
  title: string;
  description: string | null;
  locale: string;
  fileSize: number;
}

export default function CandidateApplicationTourPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const isHindi = locale === "hi";

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [videoData, setVideoData] = useState<ActiveVideoData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState<boolean>(true);

  useEffect(() => {
    async function loadActiveTourVideo() {
      try {
        setLoadingVideo(true);
        const res = await fetch(`/api/application-tour/videos/active?type=CANDIDATE_END_TOUR&locale=${locale}`);
        if (res.ok) {
          const json = await res.json();
          setVideoData(json.data || null);
        }
      } catch (e) {
        console.error("Failed to load candidate tour video:", e);
      } finally {
        setLoadingVideo(false);
      }
    }
    loadActiveTourVideo();
  }, [locale]);

  const tourSteps = [
    {
      id: "dashboard",
      title: isHindi ? "1. अभ्यर्थी डैशबोर्ड" : "1. Candidate Dashboard",
      icon: LayoutDashboard,
      badge: "/candidate/dashboard",
      description: isHindi
        ? "प्रयास किए गए मॉक टेस्ट, औसत अंक, सटीकता प्रतिशत और नवीनतम स्कोरकार्ड का त्वरित अवलोकन।"
        : "Overview of attempted mocks, completion rate, average score, accuracy, and recent test history.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "डैशबोर्ड आपके प्रदर्शन का समग्र सारांश प्रस्तुत करता है जिसमें मजबूत और कमजोर विषयों की पहचान और longitudinal प्रगति शामिल है।"
              : "The Candidate Dashboard presents longitudinal progress, topic breakdowns, weak/strong areas, and personalized recommendations."}
          </p>
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5">
            <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900 dark:text-blue-300 font-medium">
              {isHindi
                ? "शीघ्र अभ्यास शुरू करने के लिए डैशबोर्ड पर दिए गए 'मॉक टेस्ट शुरू करें' बटन पर क्लिक करें।"
                : "Click 'Start Mock Test' directly from the hero card to jump into active full-pattern examinations."}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "video_tour",
      title: isHindi ? "अभ्यर्थी वीडियो वॉकथ्रू" : "Candidate Video Walkthrough",
      icon: Video,
      badge: "Video Player",
      description: isHindi
        ? "परीक्षा देने, उत्तर ऑटोसेव और स्कोरकार्ड विश्लेषण का संपूर्ण वीडियो गाइड।"
        : "Step-by-step video guide on taking official mock tests, answering questions, and inspecting scorecards.",
      content: (
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          {loadingVideo ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs">{isHindi ? "वीडियो लोड हो रहा है..." : "Loading video tour..."}</p>
            </div>
          ) : videoData ? (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                <video
                  controls
                  src={`/api/application-tour/videos/${videoData.id}/stream`}
                  className="w-full max-h-[380px] object-contain"
                  preload="metadata"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">{videoData.title}</span>
                <Badge variant="outline">Locale: {videoData.locale.toUpperCase()}</Badge>
              </div>
              {videoData.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                  {videoData.description}
                </p>
              )}
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 bg-slate-50 dark:bg-slate-900/50">
              <Video className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isHindi ? "वीडियो टूर वर्तमान में उपलब्ध नहीं है।" : "Video tour is currently unavailable."}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isHindi
                  ? "आप नीचे दिए गए चरणों का पालन करके परीक्षा पोर्टल का उपयोग कर सकते हैं।"
                  : "You can explore all examination steps using the written interactive tour tabs on the left."}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "exams",
      title: isHindi ? "2. लक्षित परीक्षाएं ब्राउज़ करें" : "2. Explore Target Exams",
      icon: GraduationCap,
      badge: "/candidate/exams",
      description: isHindi
        ? "आधिकारिक संस्था, पद नाम और वर्ष के अनुसार परीक्षा सूचियां खोजें।"
        : "Discover and filter exams by conducting authority, post, and notification year.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "प्रत्येक परीक्षा का विस्तृत पृष्ठ सत्यापित पाठ्यक्रम, आधिकारिक दस्तावेज़ और उपलब्ध मॉक टेस्ट प्रदर्शित करता है।"
              : "Each exam details page showcases verified syllabus nodes, official notification records, and published mocks."}
          </p>
        </div>
      ),
    },
    {
      id: "mocks",
      title: isHindi ? "3. फुल-पैटर्न मॉक परीक्षाएं" : "3. Full-Pattern Mock Exams",
      icon: FileCheck,
      badge: "/candidate/mock-tests",
      description: isHindi
        ? "लॉक किए गए ब्लूप्रिंट के अनुसार सटीक प्रश्नों, अंकों, समय और नकारात्मक अंकन के साथ अभ्यास।"
        : "Take authentic full-pattern simulations strictly matching verified blueprint duration, marks, and penalties.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "मॉक कार्ड पर प्रश्नों की संख्या, कुल अंक, समय और आपके पिछले प्रयासों की संख्या व सर्वश्रेष्ठ अंक प्रदर्शित होते हैं।"
              : "Mock cards display exact question count, marks, duration, negative rate, your attempt counts (e.g. Attempt 1/10), and best score."}
          </p>
        </div>
      ),
    },
    {
      id: "instructions",
      title: isHindi ? "4. निर्देश और भाषा चयन" : "4. Instructions & Language Selection",
      icon: FileText,
      badge: "Pre-Exam Room",
      description: isHindi
        ? "परीक्षा शुरू करने से पहले नियम पढ़ें और अपनी पसंदीदा भाषा चुनें।"
        : "Read official guidelines and select question display language (English or Hindi).",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "निर्देश स्वीकार करने के बाद ही 'मैं शुरू करने के लिए तैयार हूँ' बटन सक्रिय होता है और लाइव परीक्षा शुरू होती है।"
              : "Read guidelines, select your primary language, check acknowledgement, and proceed into the live exam room."}
          </p>
        </div>
      ),
    },
    {
      id: "exam_room",
      title: isHindi ? "5. लाइव टच परीक्षा कक्ष" : "5. Live Touch Exam Interface",
      icon: Clock,
      badge: "Live Exam UX",
      description: isHindi
        ? "मोबाइल टच-अनुकूलित इंटरफेस, सर्वर सिंक टाइमर और रीयल-टाइम ऑटोसेव।"
        : "Mobile-first exam environment with server timer synchronization and instant answer autosave.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "प्रत्येक उत्तर का चयन तुरंत बैकग्राउंड में सहेजा जाता है। ब्राउज़र रीफ्रेश या बंद होने पर भी परीक्षा शेष समय के साथ सुरक्षित रहती है।"
              : "Every answer selection is instantly autosaved. Reopening or refreshing the browser safely resumes with exact remaining time."}
          </p>
        </div>
      ),
    },
    {
      id: "results",
      title: isHindi ? "6. स्कोरकार्ड एवं विस्तृत समाधान" : "6. Results & Detailed Solutions",
      icon: Award,
      badge: "/candidate/results",
      description: isHindi
        ? "प्राप्तांक, नकारात्मक अंकन कटौती, समय विश्लेषण और चरण-दर-चरण समाधान।"
        : "Inspect net score, penalty deductions, question-level time spent, and detailed explanations.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "सबमिट करते ही स्कोरकार्ड तत्काल तैयार होता है। आप अपने उत्तर बनाम सही उत्तर और विस्तृत समाधान देख सकते हैं।"
              : "Scorecards calculate immediately on submission. Compare your selected options with correct keys and step-by-step solutions."}
          </p>
        </div>
      ),
    },
    {
      id: "retakes",
      title: isHindi ? "7. पुनः परीक्षा (Multiple Retakes)" : "7. Multi-Attempt Retakes",
      icon: RotateCcw,
      badge: "Attempt 2, 3...",
      description: isHindi
        ? "अपनी तैयारी को सुधारने के लिए उसी आधिकारिक मॉक टेस्ट को दोबारा हल करें।"
        : "Retake the exact same official mock test multiple times to measure longitudinal score growth.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "प्रत्येक रीटेक एक नया प्रयास (Attempt 2, Attempt 3...) बनाता है और सभी पिछले प्रयासों का इतिहास सुरक्षित रहता है।"
              : "Each retake creates a distinct attempt record, tracking your score progression over time while preserving history."}
          </p>
        </div>
      ),
    },
    {
      id: "practice",
      title: isHindi ? "8. एआई प्रैक्टिस ड्रिल्स (PDF/DOCX/URL)" : "8. Custom AI Practice Drills",
      icon: Sparkles,
      badge: "/candidate/practice",
      description: isHindi
        ? "अपने नोट्स, पीडीएफ या सुरक्षित यूआरएल से लक्षित अभ्यास प्रश्न तैयार करें।"
        : "Ingest custom study resources (PDF, DOCX, images, text, URLs) to generate topic-focused practice drills.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "आधिकारिक फुल मॉक के अतिरिक्त आप किसी भी विशिष्ट विषय पर त्वरित 10-20 प्रश्नों का अभ्यास टेस्ट बना सकते हैं।"
              : "Generate targeted dynamic drills separate from official mocks to reinforce weak topics identified in your diagnostic scorecard."}
          </p>
        </div>
      ),
    },
  ];

  const currentStep = tourSteps.find((s) => s.id === activeTab) || tourSteps[0];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold">
              <Compass className="h-3.5 w-3.5" />
              {isHindi ? "अभ्यर्थी ऑनबोर्डिंग गाइड" : "Candidate Onboarding & Video Tour"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isHindi ? "अभ्यर्थी एप्लिकेशन टूर एवं परीक्षा मार्गदर्शिका" : "Candidate Application Tour & Guide"}
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl">
              {isHindi
                ? "ब्लूप्रिंट-सत्यापित परीक्षा सिमुलेशन, मोबाइल परीक्षा कक्ष, स्कोरकार्ड विश्लेषण और एआई प्रैक्टिस ड्रिल्स की संपूर्ण जानकारी।"
                : "Step-by-step guide for taking official mock examinations, autosave features, scorecard diagnostics, and custom AI practice drills."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("video_tour")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-xs min-h-[38px]"
            >
              <Video className="h-4 w-4 mr-1.5" />
              {isHindi ? "वीडियो टूर देखें" : "Watch Video Tour"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tour Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Sidebar */}
        <div className="md:col-span-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            {isHindi ? "टूर अनुभाग (Tour Chapters)" : "Tour Chapters"}
          </h3>
          <div className="space-y-1 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {tourSteps.map((step) => {
              const Icon = step.icon;
              const isCurrent = step.id === activeTab;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all min-h-[44px] ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isCurrent ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{step.title}</span>
                  </div>
                  {isCurrent && <CheckCircle2 className="h-4 w-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Content Display */}
        <div className="md:col-span-8">
          <Card className="shadow-xs border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {currentStep.badge}
                </span>
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Compass className="h-4 w-4" />
                  <span className="text-xs font-bold">ExamPattern Candidate Portal</span>
                </div>
              </div>
              <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                {currentStep.title}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {currentStep.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6 border-t border-slate-100 dark:border-slate-800">
              {currentStep.content}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
