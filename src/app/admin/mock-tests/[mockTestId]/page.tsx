"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Globe,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ValidationCheckItem {
  name: string;
  passed: boolean;
  expected: string | number;
  actual: string | number;
  details?: string;
}

interface MockDetailData {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeRate: number;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  examVersion: {
    versionName: string;
    exam: { name: string; authority: string };
  };
  blueprint?: {
    id: string;
    title: string;
    totalQuestions: number;
    totalMarks: number;
  } | null;
  sections: {
    id: string;
    name: string;
    sectionOrder: number;
    questionCount: number;
    marksPerQuestion: number;
    questions: {
      id: string;
      questionOrder: number;
      marks: number;
      question: {
        id: string;
        questionText: string;
        difficulty: string;
        options: { optionKey: string; optionText: string; isCorrect: boolean }[];
      };
    }[];
  }[];
  validationResults: {
    id: string;
    isValid: boolean;
    scoreReport: { checks?: ValidationCheckItem[] };
    errorSummary?: string | null;
    validatedAt: string;
  }[];
}

export default function AdminMockDetailPage({
  params,
}: {
  params: Promise<{ mockTestId: string }>;
}) {
  const resolvedParams = use(params);
  const mockTestId = resolvedParams.mockTestId;

  const [mock, setMock] = useState<MockDetailData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadMock = useCallback(async () => {
    try {
      const res = await fetch(`/api/mock-tests/${mockTestId}`);
      const data = await res.json();
      if (data.success && data.data?.mockTest) {
        setMock(data.data.mockTest);
      }
    } catch {
      console.error("Failed to load mock details");
    }
  }, [mockTestId]);

  useEffect(() => {
    loadMock();
  }, [loadMock]);

  const handleValidate = async () => {
    setIsValidating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/mock-tests/${mockTestId}/validate`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Pattern validation failed", type: "error" });
        setIsValidating(false);
        return;
      }

      setMessage({
        text: data.data.report.isValid
          ? "Pattern validation PASSED! 100% compliant with blueprint."
          : "Pattern validation check completed with issues.",
        type: data.data.report.isValid ? "success" : "error",
      });
      setIsValidating(false);
      loadMock();
    } catch {
      setMessage({ text: "Network error validating mock pattern", type: "error" });
      setIsValidating(false);
    }
  };

  const handlePublish = async (status: "PUBLISHED" | "ARCHIVED") => {
    setIsPublishing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/mock-tests/${mockTestId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Failed to update publish status", type: "error" });
        setIsPublishing(false);
        return;
      }

      setMessage({ text: `Mock test status updated to ${status}!`, type: "success" });
      setIsPublishing(false);
      loadMock();
    } catch {
      setMessage({ text: "Network error updating publish status", type: "error" });
      setIsPublishing(false);
    }
  };

  if (!mock) {
    return <div className="p-8 text-center text-slate-500">Loading mock test...</div>;
  }

  const latestValidation = mock.validationResults?.[0];
  const checksList = latestValidation?.scoreReport?.checks || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/mock-tests">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
              <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleValidate}
            disabled={isValidating}
            isLoading={isValidating}
            className="gap-1.5 font-semibold text-indigo-600 border-indigo-200 min-h-[36px]"
          >
            <ShieldCheck className="h-4 w-4" /> Run Pattern Validation
          </Button>

          {mock.status !== "PUBLISHED" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handlePublish("PUBLISHED")}
              disabled={isPublishing}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-semibold min-h-[36px]"
            >
              <Globe className="h-4 w-4" /> Publish for Candidates
            </Button>
          )}

          {mock.status === "PUBLISHED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePublish("ARCHIVED")}
              disabled={isPublishing}
              className="gap-1.5 text-slate-600 min-h-[36px]"
            >
              <Archive className="h-4 w-4" /> Archive Mock
            </Button>
          )}
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
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Overview Banner */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{mock.type}</Badge>
                <Badge variant={mock.status === "PUBLISHED" ? "success" : "warning"}>{mock.status}</Badge>
                {latestValidation && (
                  <Badge variant={latestValidation.isValid ? "success" : "destructive"}>
                    Pattern Validation: {latestValidation.isValid ? "PASSED" : "FAILED"}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-2">{mock.title}</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {mock.examVersion.exam.name} • {mock.examVersion.versionName}
              </CardDescription>
            </div>

            <div className="flex gap-3 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-slate-400">Questions</span>
                <strong className="text-base font-bold text-slate-900">{mock.totalQuestions}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-slate-400">Total Marks</span>
                <strong className="text-base font-bold text-slate-900">{mock.totalMarks.toString()}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-slate-400">Duration</span>
                <strong className="text-base font-bold text-slate-900">{mock.durationMinutes}m</strong>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pattern Validation Engine Report */}
      {latestValidation && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" /> Pattern Validation Engine Compliance
            </CardTitle>
            <CardDescription className="text-xs">
              Automated deterministic verification against locked blueprint (Validated on {formatDate(latestValidation.validatedAt)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checksList.map((chk, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                    chk.passed
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : "bg-red-50/60 border-red-200 text-red-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {chk.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{chk.name}</span>
                      {chk.details && <p className="text-[11px] opacity-80 mt-0.5">{chk.details}</p>}
                    </div>
                  </div>
                  <div className="font-mono text-xs">
                    Expected: {chk.expected} | Actual: {chk.actual}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections and Questions Snapshot */}
      <div className="space-y-4">
        {mock.sections.map((sec) => (
          <Card key={sec.id} className="shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  Section {sec.sectionOrder}: {sec.name}
                </CardTitle>
                <Badge variant="outline">
                  {sec.questions.length} Items • {sec.marksPerQuestion.toString()} Mark/Q
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {sec.questions.map((mq) => (
                <div
                  key={mq.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      <span className="font-mono text-slate-400 mr-1.5">Q{mq.questionOrder}.</span>
                      {mq.question.questionText}
                    </p>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {mq.question.difficulty}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {mq.question.options.map((opt) => (
                      <div
                        key={opt.optionKey}
                        className={`p-1.5 rounded border ${
                          opt.isCorrect
                            ? "bg-emerald-50 border-emerald-300 font-bold text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        {opt.optionKey}. {opt.optionText}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
