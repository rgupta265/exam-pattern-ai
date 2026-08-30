"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Compass,
  Shield,
  Layers,
  GraduationCap,
  FileText,
  HelpCircle,
  FileCheck,
  Users,
  Video,
  CheckCircle2,
  Lightbulb,
  Upload,
  Trash2,
  Play,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath } from "@/lib/i18n";

interface TourVideoRecord {
  id: string;
  type: "FULL_APPLICATION_TOUR" | "CANDIDATE_END_TOUR";
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  locale: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminApplicationTourPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const isHindi = locale === "hi";

  const [activeTab, setActiveTab] = useState<string>("overview");

  // Video Management State
  const [videos, setVideos] = useState<TourVideoRecord[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedVideoType, setSelectedVideoType] = useState<"FULL_APPLICATION_TOUR" | "CANDIDATE_END_TOUR">("FULL_APPLICATION_TOUR");
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadDesc, setUploadDesc] = useState<string>("");
  const [uploadLocale, setUploadLocale] = useState<string>("all");
  const [uploadPublish, setUploadPublish] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setLoadingVideos(true);
      const res = await fetch("/api/admin/tour-videos");
      if (res.ok) {
        const json = await res.json();
        setVideos(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load tour videos:", e);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setActionError(isHindi ? "कृपया वीडियो फ़ाइल चुनें" : "Please select a video file");
      return;
    }

    try {
      setUploading(true);
      setActionError(null);
      setActionSuccess(null);

      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("type", selectedVideoType);
      formData.append("title", uploadTitle || (selectedVideoType === "FULL_APPLICATION_TOUR" ? "Full Application Tour" : "Candidate End Tour"));
      formData.append("description", uploadDesc);
      formData.append("locale", uploadLocale);
      formData.append("isPublished", uploadPublish ? "true" : "false");

      const res = await fetch("/api/admin/tour-videos", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to upload video");
      }

      setActionSuccess(isHindi ? "वीडियो सफलतापूर्वक अपलोड किया गया!" : "Tour video uploaded successfully!");
      setSelectedFile(null);
      setUploadTitle("");
      setUploadDesc("");
      await fetchVideos();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePublish = async (videoId: string, currentStatus: boolean) => {
    try {
      setActionError(null);
      const res = await fetch(`/api/admin/tour-videos/${videoId}/publish`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      if (res.ok) {
        await fetchVideos();
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update publication status");
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm(isHindi ? "क्या आप वाकई इस वीडियो को हटाना चाहते हैं?" : "Are you sure you want to delete this video?")) {
      return;
    }
    try {
      setActionError(null);
      const res = await fetch(`/api/admin/tour-videos/${videoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchVideos();
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete video");
    }
  };

  const currentTypeVideos = videos.filter((v) => v.type === selectedVideoType);
  const activePublishedVideo = currentTypeVideos.find((v) => v.isPublished && (v.locale === locale || v.locale === "all")) || currentTypeVideos[0];

  const tourSteps = [
    {
      id: "overview",
      title: isHindi ? "प्लेटफ़ॉर्म सिद्धांत एवं अवलोकन" : "Platform Principles & Overview",
      icon: Shield,
      badge: "Core Architecture",
      description: isHindi
        ? "ExamPattern AI आधिकारिक परीक्षा नियमों और ब्लूप्रिंट का 100% कड़ाई से पालन करने वाला मॉड्यूलर प्लेटफॉर्म है।"
        : "ExamPattern AI is a modular monolith platform strictly enforcing official blueprints as the sole authoritative source of truth.",
      content: (
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "प्लेटफॉर्म का मूल सिद्धांत: AI कभी भी परीक्षा नियमों, प्रश्नों की संख्या, नकारात्मक अंकन या परीक्षा अवधि का अंतिम प्राधिकारी नहीं होता। केवल अधिकृत एडमिन द्वारा सत्यापित और लॉक किया गया ब्लूप्रिंट ही अंतिम प्राधिकारी होता है।"
              : "Core Principle: AI is never the final authority for official exam rules, question counts, negative marking, or duration. The verified, locked blueprint approved by an authorized administrator is the sole authority."}
          </p>
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-300">
                {isHindi ? "प्रमाणीकरण जीवन चक्र (Lifecycle State Machine)" : "Blueprint Lifecycle State Machine"}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-400 mt-1 font-mono">
                DRAFT ──► AI_ANALYZED ──► UNDER_REVIEW ──► VERIFIED ──► LOCKED ──► ACTIVE
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "video_management",
      title: isHindi ? "एप्लिकेशन टूर वीडियो प्रबंधन" : "Application Tour Video Management",
      icon: Video,
      badge: "Video Console",
      description: isHindi
        ? "फुल एप्लिकेशन टूर और अभ्यर्थी टूर वीडियो अपलोड, पूर्वावलोकन, प्रतिस्थापित और प्रकाशित करें।"
        : "Upload, preview, replace, publish, and manage Full Application Tour and Candidate End Tour videos.",
      content: (
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Video Type Selector */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setSelectedVideoType("FULL_APPLICATION_TOUR")}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors min-h-[40px] ${
                selectedVideoType === "FULL_APPLICATION_TOUR"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isHindi ? "फुल एप्लिकेशन टूर (Full Tour)" : "Full Application Tour"}
            </button>
            <button
              onClick={() => setSelectedVideoType("CANDIDATE_END_TOUR")}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors min-h-[40px] ${
                selectedVideoType === "CANDIDATE_END_TOUR"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isHindi ? "अभ्यर्थी टूर (Candidate End Tour)" : "Candidate End Tour"}
            </button>
          </div>

          {actionSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              {actionError}
            </div>
          )}

          {/* Active Video Player Preview */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-600" />
                {selectedVideoType === "FULL_APPLICATION_TOUR" ? "Full Application Tour" : "Candidate End Tour"} Preview
              </h4>
              {loadingVideos && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>

            {activePublishedVideo ? (
              <div className="space-y-3">
                <video
                  key={activePublishedVideo.id}
                  controls
                  src={`/api/application-tour/videos/${activePublishedVideo.id}/stream`}
                  className="w-full rounded-lg max-h-[360px] bg-black"
                  preload="metadata"
                />
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{activePublishedVideo.title}</span>
                    <span className="ml-2 text-slate-500 font-mono">({(activePublishedVideo.fileSize / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={activePublishedVideo.isPublished ? "default" : "secondary"}>
                      {activePublishedVideo.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline">Locale: {activePublishedVideo.locale.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <Video className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {isHindi ? "इस श्रेणी के लिए कोई वीडियो अपलोड नहीं है।" : "No active video uploaded for this tour category."}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isHindi ? "नीचे दिए गए फ़ॉर्म से MP4/WebM वीडियो अपलोड करें।" : "Upload an MP4 or WebM video using the form below."}
                </p>
              </div>
            )}
          </div>

          {/* Upload New Video Form */}
          <form onSubmit={handleUpload} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-600" />
              {isHindi ? "नया वीडियो अपलोड करें" : "Upload / Replace Tour Video"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isHindi ? "शीर्षक (Title)" : "Title"}
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={selectedVideoType === "FULL_APPLICATION_TOUR" ? "Full Application Tour Walkthrough" : "Candidate Practice Walkthrough"}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs bg-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isHindi ? "भाषा (Locale)" : "Language / Locale"}
                </label>
                <select
                  value={uploadLocale}
                  onChange={(e) => setUploadLocale(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs bg-transparent"
                >
                  <option value="all">All Locales (Universal)</option>
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {isHindi ? "विवरण (Description)" : "Description"}
              </label>
              <textarea
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Walkthrough notes, release version, or key points covered..."
                rows={2}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs bg-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {isHindi ? "वीडियो फ़ाइल (MP4, WebM - Max 100MB)" : "Video File (MP4, WebM - Max 100MB)"}
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publish-check"
                checked={uploadPublish}
                onChange={(e) => setUploadPublish(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <label htmlFor="publish-check" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {isHindi ? "अपलोड के बाद तुरंत प्रकाशित करें" : "Publish immediately upon upload"}
              </label>
            </div>

            <Button type="submit" disabled={uploading || !selectedFile} className="w-full sm:w-auto font-semibold text-xs">
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  {isHindi ? "अपलोड हो रहा है..." : "Uploading Video..."}
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {isHindi ? "वीडियो अपलोड करें" : "Upload Video"}
                </>
              )}
            </Button>
          </form>

          {/* Uploaded Videos Table */}
          {currentTypeVideos.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
                {isHindi ? "अपलोड किए गए वीडियो की सूची" : "Uploaded Videos Repository"}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentTypeVideos.map((v) => (
                  <div key={v.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{v.title}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {v.fileName} • {(v.fileSize / (1024 * 1024)).toFixed(2)} MB • {v.locale.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={v.isPublished ? "default" : "outline"}
                        onClick={() => handleTogglePublish(v.id, v.isPublished)}
                        className="text-xs h-7 px-2.5"
                      >
                        {v.isPublished ? "Published" : "Unpublished"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(v.id)}
                        className="text-xs h-7 px-2.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "exams",
      title: isHindi ? "1. परीक्षा और संस्करण प्रबंधन" : "1. Exam & Versions Management",
      icon: GraduationCap,
      badge: "/admin/exams",
      description: isHindi
        ? "परीक्षा श्रेणियां, परीक्षा संस्थाएं और संस्करण (वर्ष/अधिसूचना चक्र) बनाएं।"
        : "Create Exam Categories, Exams, and individual Exam Versions (Notification Cycles).",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "हर परीक्षा का अपना अलग संस्करण (जैसे UP Health Officer 2026) होता है। सभी आधिकारिक दस्तावेज़ और ब्लूप्रिंट इसी संस्करण से जुड़े होते हैं।"
              : "Each examination has distinct versions (e.g., UP Health Officer 2026). All documents, syllabi, and blueprints belong strictly to their specific version."}
          </p>
        </div>
      ),
    },
    {
      id: "documents",
      title: isHindi ? "2. आधिकारिक दस्तावेज़ और सत्यापन" : "2. Official Documents & Verification",
      icon: FileText,
      badge: "/admin/notifications",
      description: isHindi
        ? "मूल पीडीएफ/विज्ञापन अपलोड करें और जेमिनी एआई द्वारा पाठ्यक्रम व पैटर्न निकालें।"
        : "Upload official notification PDFs, process them via Gemini AI, and verify extracted structures.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "अपलोड किए गए दस्तावेज़ स्थानीय सुरक्षित स्टोरेज में संग्रहीत होते हैं। AI द्वारा निकाले गए डेटा की एडमिन द्वारा मानवीय समीक्षा और सत्यापन अनिवार्य है।"
              : "Uploaded documents are stored in secure local filesystem storage. Extracted data requires mandatory human verification by an authorized admin."}
          </p>
        </div>
      ),
    },
    {
      id: "blueprints",
      title: isHindi ? "3. ब्लूप्रिंट और लॉकिंग" : "3. Blueprint Definition & Locking",
      icon: Layers,
      badge: "/admin/blueprints",
      description: isHindi
        ? "परीक्षा के नियम, प्रश्नों की संख्या, समय और नकारात्मक अंकन को स्थायी रूप से लॉक करें।"
        : "Configure total questions, duration, negative penalty, and lock blueprint permanently.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "एक बार ब्लूप्रिंट 'LOCKED' हो जाने के बाद, इसे कभी चुपचाप संशोधित नहीं किया जा सकता। किसी भी संशोधन के लिए नया संस्करण तैयार करना होगा।"
              : "Once locked, blueprints become permanently immutable. Official amendments spawn a distinct version to preserve historical validity."}
          </p>
        </div>
      ),
    },
    {
      id: "questions",
      title: isHindi ? "4. प्रश्न बैंक और एआई जनरेशन" : "4. Question Bank & AI Generation",
      icon: HelpCircle,
      badge: "/admin/questions",
      description: isHindi
        ? "सत्यापित पाठ्यक्रम विषयों से बंधे द्विभाषी प्रश्न बनाएं या एआई द्वारा तैयार करें।"
        : "Manage bilingual questions, reviewer approval queues, and Gemini syllabus-bounded generation.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "सभी प्रश्न आधिकारिक पाठ्यक्रम के नोड्स से मैप होते हैं और दोनों भाषाओं (अंग्रेजी व हिंदी) में स्पष्टीकरण के साथ उपलब्ध होते हैं।"
              : "All questions map directly to syllabus nodes and contain step-by-step explanations in both English and Hindi."}
          </p>
        </div>
      ),
    },
    {
      id: "mocks",
      title: isHindi ? "5. 11-बिंदु पैटर्न सत्यापन इंजन" : "5. Mock Generation & Validation Engine",
      icon: FileCheck,
      badge: "/admin/mock-tests",
      description: isHindi
        ? "मॉक टेस्ट बनाएं और 100% ब्लूप्रिंट अनुपालन के लिए स्वचालित सत्यापन इंजन चलाएं।"
        : "Assemble full-pattern mocks and run the 11-point Pattern Validation Engine before publication.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "सत्यापन इंजन प्रश्नों की संख्या, अनुभाग वितरण, अंक, समय, नकारात्मक अंकन और शून्य डुप्लीकेट प्रश्नों की पुष्टि करता है।"
              : "The automated validation engine guarantees 100% compliance with locked blueprint rules before a mock test can be published."}
          </p>
        </div>
      ),
    },
    {
      id: "candidates",
      title: isHindi ? "6. अभ्यर्थी ऑडिट एवं डायग्नोस्टिक्स" : "6. Candidate Attempt Diagnostics",
      icon: Users,
      badge: "/admin/candidates",
      description: isHindi
        ? "अभ्यर्थी के प्रयासों, बदले गए उत्तरों, प्रति-प्रश्न समय और रीटेक का पूर्ण विवरण देखें।"
        : "Inspect full candidate attempt transcripts, question-level time spent, answer revisions, and scores.",
      content: (
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            {isHindi
              ? "व्यवस्थापक प्रत्येक अभ्यर्थी के सभी प्रयासों (Attempt 1, 2, 3...) और प्रत्येक प्रश्न पर बिताए गए समय का सटीक विश्लेषण देख सकते हैं।"
              : "Administrators enjoy full diagnostic visibility into candidate attempts, answer revision logs, and multi-retake progression."}
          </p>
        </div>
      ),
    },
  ];

  const currentStep = tourSteps.find((s) => s.id === activeTab) || tourSteps[0];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Compass className="h-3.5 w-3.5" />
              {isHindi ? "व्यवस्थापक ऑनबोर्डिंग गाइड" : "Administrator Onboarding & Video Console"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isHindi ? "ExamPattern AI एडमिनिस्ट्रेटर एप्लिकेशन टूर" : "ExamPattern AI Administrator Tour"}
            </h1>
            <p className="text-sm text-blue-100/80 max-w-2xl">
              {isHindi
                ? "आधिकारिक परीक्षा ब्लूप्रिंट, पाठ्यक्रम पदानुक्रम, एआई प्रश्न निर्माण, पैटर्न सत्यापन और टूर वीडियो प्रबंधन के लिए संपूर्ण मार्गदर्शिका।"
                : "Comprehensive architectural workflows, pattern validation rules, candidate diagnostics, and application tour video management."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("video_management")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold text-xs"
            >
              <Video className="h-4 w-4 mr-1.5" />
              {isHindi ? "वीडियो प्रबंधित करें" : "Manage Tour Videos"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tour Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Sidebar */}
        <div className="md:col-span-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            {isHindi ? "टूर अनुभाग (Tour Chapters)" : "Tour Chapters & Controls"}
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
                  <span className="text-xs font-bold">ExamPattern Admin Console</span>
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
