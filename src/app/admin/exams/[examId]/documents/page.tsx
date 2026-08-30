"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ExamVersionReadinessReport } from "@/services/document/document-readiness.service";

interface DocItem {
  id: string;
  title: string;
  documentType: string;
  classification?: string;
  status?: string;
  createdAt: string;
  file: {
    id: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    checksumSha256: string;
  };
  jobs: {
    id: string;
    status: string;
    errorMessage?: string | null;
  }[];
}

interface VersionOption {
  id: string;
  versionName: string;
  year: number;
  notificationNumber?: string | null;
}

export default function AdminExamDocumentsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;

  const [versions, setVersions] = useState<VersionOption[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [examName, setExamName] = useState("");
  const [readiness, setReadiness] = useState<ExamVersionReadinessReport | null>(null);

  // Upload Form State
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("OFFICIAL_NOTIFICATION");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadReadiness = useCallback(async (versionId: string) => {
    if (!versionId) return;
    try {
      const res = await fetch(`/api/documents/readiness/${versionId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setReadiness(data.data);
      }
    } catch {
      console.error("Failed to load document readiness");
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [examRes, verRes] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch(`/api/exams/${examId}/versions`),
      ]);

      const examData = await examRes.json();
      const verData = await verRes.json();

      if (examData.success && examData.data?.exam) {
        setExamName(examData.data.exam.name);
      }

      if (verData.success && verData.data?.versions?.length > 0) {
        setVersions(verData.data.versions);
        const currentVerId = selectedVersionId || verData.data.versions[0].id;
        if (!selectedVersionId) {
          setSelectedVersionId(currentVerId);
        }
        const matched = verData.data.versions.find((v: VersionOption) => v.id === currentVerId);
        if (matched && (matched as { documents?: DocItem[] }).documents) {
          setDocuments((matched as { documents: DocItem[] }).documents);
        }
        loadReadiness(currentVerId);
      }
    } catch {
      console.error("Failed to load documents data");
    }
  }, [examId, selectedVersionId, loadReadiness]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVersionChange = (verId: string) => {
    setSelectedVersionId(verId);
    const matched = versions.find((v) => v.id === verId) as unknown as { documents?: DocItem[] };
    if (matched && matched.documents) {
      setDocuments(matched.documents);
    }
    loadReadiness(verId);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedVersionId) {
      setMessage({ text: "Please select a file and exam version", type: "error" });
      return;
    }

    setMessage(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("examVersionId", selectedVersionId);
      formData.append("documentType", docType);
      formData.append("title", title);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Failed to upload document", type: "error" });
        setIsUploading(false);
        return;
      }

      setMessage({ text: "Document uploaded successfully! You can now verify or analyze it with AI.", type: "success" });
      setIsUploading(false);
      setTitle("");
      setFile(null);
      loadData();
    } catch {
      setMessage({ text: "An error occurred during upload.", type: "error" });
      setIsUploading(false);
    }
  };

  const handleVerify = async (documentId: string) => {
    setVerifyingDocId(documentId);
    setMessage(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Verified by administrator" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Failed to verify document", type: "error" });
        setVerifyingDocId(null);
        return;
      }

      setMessage({ text: "Document marked as VERIFIED and added to authoritative context.", type: "success" });
      setVerifyingDocId(null);
      loadData();
    } catch {
      setMessage({ text: "Network error while verifying document.", type: "error" });
      setVerifyingDocId(null);
    }
  };

  const handleProcess = async (documentId: string) => {
    setProcessingDocId(documentId);
    setMessage(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/process`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({
          text: data.error?.message || "Gemini document analysis failed",
          type: "error",
        });
        setProcessingDocId(null);
        return;
      }

      setMessage({
        text: "Gemini AI analysis complete! Blueprint draft and Syllabus extracted.",
        type: "success",
      });
      setProcessingDocId(null);
      loadData();
    } catch {
      setMessage({ text: "Network error while triggering AI extraction.", type: "error" });
      setProcessingDocId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/exams/${examId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
              <ArrowLeft className="h-4 w-4" /> Back to Exam Overview
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/admin/exams/${examId}/mock-tests/create`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 min-h-[36px]">
              <Sparkles className="h-4 w-4" /> Generate Actual Mock
            </Button>
          </Link>
          <Link href={`/admin/exams/${examId}/blueprint`}>
            <Button variant="outline" size="sm" className="font-semibold min-h-[36px]">
              View Blueprint
            </Button>
          </Link>
          <Link href={`/admin/exams/${examId}/syllabus`}>
            <Button variant="outline" size="sm" className="font-semibold min-h-[36px]">
              View Syllabus
            </Button>
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
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

      {/* Document Readiness Checklist Card */}
      {readiness && (
        <Card className={`border-2 ${readiness.isReadyForMockGeneration ? "border-emerald-500/60 bg-emerald-50/20" : "border-amber-400/60 bg-amber-50/20"}`}>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className={`h-5 w-5 ${readiness.isReadyForMockGeneration ? "text-emerald-600" : "text-amber-600"}`} />
                  Document Readiness: {readiness.examName} ({readiness.versionName})
                </CardTitle>
                <CardDescription className="text-xs">
                  Authoritative context isolation for {readiness.year} notification cycle
                </CardDescription>
              </div>

              <Badge
                variant={readiness.isReadyForMockGeneration ? "success" : "warning"}
                className="text-xs py-1 px-3 self-start md:self-auto font-bold uppercase tracking-wider"
              >
                {readiness.isReadyForMockGeneration ? "✓ READY FOR ACTUAL MOCK GENERATION" : "MISSING REQUIRED DOCUMENTS"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Required Documents Column */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">
                  Required Documents
                </span>
                <div className="space-y-1.5">
                  {readiness.requiredChecklist.map((item) => (
                    <div key={item.documentType} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.isVerified ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <span className={item.isVerified ? "text-slate-900 font-medium" : "text-slate-500 font-medium"}>
                          {item.documentType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <Badge variant={item.isVerified ? "success" : "destructive"} className="text-[10px] py-0 px-1.5">
                        {item.isVerified ? `Verified (${item.verifiedCount})` : "Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blueprint & Syllabus Status */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">
                  Blueprint & Syllabus
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {readiness.blueprintReady ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span>Locked Blueprint</span>
                    </div>
                    <Badge variant={readiness.blueprintReady ? "success" : "destructive"} className="text-[10px] py-0 px-1.5">
                      {readiness.blueprintReady ? `${readiness.blueprintDetails?.totalQuestions} Qs` : "Missing"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {readiness.syllabusReady ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span>Verified Syllabus</span>
                    </div>
                    <Badge variant={readiness.syllabusReady ? "success" : "destructive"} className="text-[10px] py-0 px-1.5">
                      {readiness.syllabusReady ? `${readiness.syllabusDetails?.topicsCount} Topics` : "Unverified"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Optional & Reference Documents */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block text-[11px]">
                  Optional Documents
                </span>
                <div className="space-y-1.5">
                  {readiness.optionalChecklist.slice(0, 4).map((item) => (
                    <div key={item.documentType} className="flex items-center justify-between">
                      <span className="text-slate-600 truncate">{item.documentType.replace(/_/g, " ")}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.verifiedCount > 0 ? `✓ ${item.verifiedCount}` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload New Document Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" /> Upload Exam Version Document
          </CardTitle>
          <CardDescription>
            {examName ? `Target Exam: ${examName}` : "Upload official documents to trigger AI pattern and syllabus extraction"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleUpload}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label htmlFor="versionSelect" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notification Cycle / Version
                </label>
                <select
                  id="versionSelect"
                  value={selectedVersionId}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.versionName} ({v.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label htmlFor="docType" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Document Category
                </label>
                <select
                  id="docType"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OFFICIAL_NOTIFICATION">Official Notification (Required)</option>
                  <option value="ADVERTISEMENT">Official Advertisement</option>
                  <option value="DETAILED_NOTIFICATION">Detailed Notification</option>
                  <option value="SYLLABUS">Official Syllabus (Required)</option>
                  <option value="EXAM_PATTERN">Exam Pattern Document (Required)</option>
                  <option value="BLUEPRINT">Official Blueprint</option>
                  <option value="CORRIGENDUM">Corrigendum / Amendment</option>
                  <option value="PREVIOUS_YEAR_PAPER">Previous Year Question Paper</option>
                  <option value="ANSWER_KEY">Official Answer Key</option>
                  <option value="ELIGIBILITY">Eligibility Guidelines</option>
                  <option value="REFERENCE_MATERIAL">Reference Material</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>
            </div>

            <Input
              id="title"
              label="Document Title"
              placeholder="e.g. UP Health Officer 2026 Official Notification PDF"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="w-full">
              <label htmlFor="fileUpload" className="block text-sm font-medium text-slate-700 mb-1.5">
                Select File (PDF, DOCX, TXT, PNG/JPG — max 50MB)
              </label>
              <input
                id="fileUpload"
                type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const selected = e.target.files[0];
                    setFile(selected);
                    if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" isLoading={isUploading} className="font-semibold">
              Upload Document
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Documents List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Uploaded Documents & Verification Status</CardTitle>
          <CardDescription>
            Authoritative documents for selected exam version used by Gemini AI for actual pattern generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
              No documents uploaded for this exam version yet. Upload a notification above.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const latestJob = doc.jobs?.[0];
                const isProcessing = processingDocId === doc.id || latestJob?.status === "PROCESSING";
                const isVerifying = verifyingDocId === doc.id;
                const isVerified = doc.status === "VERIFIED";

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-base">{doc.title}</span>
                        <Badge variant="outline" className="text-xs bg-white font-mono">
                          {doc.documentType}
                        </Badge>
                        <Badge variant={isVerified ? "success" : "warning"}>
                          {isVerified ? "✓ Verified Authoritative" : doc.status || "Uploaded"}
                        </Badge>
                        {latestJob && (
                          <Badge
                            variant={
                              latestJob.status === "COMPLETED"
                                ? "success"
                                : latestJob.status === "FAILED"
                                ? "destructive"
                                : "warning"
                            }
                          >
                            {latestJob.status === "COMPLETED" ? "AI Processed" : latestJob.status}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>File: <strong className="text-slate-700">{doc.file.originalName}</strong></span>
                        <span>Size: <strong className="text-slate-700">{(doc.file.fileSize / 1024).toFixed(1)} KB</strong></span>
                        <span>SHA-256: <strong className="font-mono text-slate-600">{doc.file.checksumSha256.slice(0, 10)}...</strong></span>
                        <span>Uploaded: {formatDate(doc.createdAt)}</span>
                      </div>

                      {latestJob?.errorMessage && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          Error: {latestJob.errorMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                      <a
                        href={`/api/files/${doc.file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs min-h-[36px]">
                          <Eye className="h-3.5 w-3.5" /> View File
                        </Button>
                      </a>

                      {!isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(doc.id)}
                          disabled={isVerifying}
                          isLoading={isVerifying}
                          className="gap-1.5 text-xs font-semibold min-h-[36px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Verify
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleProcess(doc.id)}
                        disabled={isProcessing}
                        isLoading={isProcessing}
                        className="gap-1.5 font-semibold text-xs min-h-[36px]"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Processing AI...
                          </>
                        ) : (
                          <>
                            <Cpu className="h-3.5 w-3.5 text-amber-300" />
                            {latestJob?.status === "COMPLETED" ? "Re-Extract with AI" : "Process with Gemini AI"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
