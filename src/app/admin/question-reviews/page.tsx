"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionReviewItem {
  id: string;
  questionText: string;
  difficulty: string;
  status: string;
  source: string;
  explanation?: string | null;
  topic: {
    name: string;
    section: {
      name: string;
      syllabus: {
        examVersion: {
          exam: { name: string };
          versionName: string;
        };
      };
    };
  };
  options: {
    id: string;
    optionKey: string;
    optionText: string;
    isCorrect: boolean;
  }[];
}

export default function AdminQuestionReviewsPage() {
  const [questions, setQuestions] = useState<QuestionReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadPendingQuestions() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/questions?status=AI_GENERATED&pageSize=20");
      const data = await res.json();
      if (data.success && data.data?.items) {
        setQuestions(data.data.items);
      }
    } catch {
      console.error("Failed to load review queue");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPendingQuestions();
  }, []);

  const handleDecision = async (questionId: string, decision: "APPROVED" | "REJECTED" | "NEEDS_REVISION") => {
    setProcessingId(questionId);
    setMessage(null);

    try {
      const res = await fetch(`/api/questions/${questionId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Review action failed", type: "error" });
        setProcessingId(null);
        return;
      }

      setMessage({ text: `Question successfully marked as ${decision}!`, type: "success" });
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setProcessingId(null);
    } catch {
      setMessage({ text: "Network error while submitting review", type: "error" });
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Question Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve AI-generated questions before they enter active mock test pools.
          </p>
        </div>
        <Button href="/admin/questions" variant="outline" className="min-h-[44px]">
          Back to Question Bank
        </Button>
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

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading review items...</div>
      ) : questions.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <CheckSquare className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">All Questions Reviewed</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              There are no pending AI-generated questions awaiting review.
            </p>
            <div className="mt-6">
              <Link href="/admin/questions/create">
                <Button size="sm">Generate New Batch</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const isProcessing = processingId === q.id;

            return (
              <Card key={q.id} className="shadow-sm border-amber-200">
                <CardHeader className="bg-amber-50/40 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="warning">{q.status}</Badge>
                      <Badge variant="outline">{q.difficulty}</Badge>
                      <span className="text-xs text-slate-600 font-semibold">
                        {q.topic.section.syllabus.examVersion.exam.name} • {q.topic.name}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <p className="font-bold text-slate-900 text-base">{q.questionText}</p>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id || opt.optionKey}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                          opt.isCorrect
                            ? "bg-emerald-50 border-emerald-300 font-bold text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="w-5">{opt.optionKey}.</span>
                        <span>{opt.optionText}</span>
                        {opt.isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900">Explanation:</strong> {q.explanation}
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isProcessing}
                      onClick={() => handleDecision(q.id, "REJECTED")}
                      className="gap-1.5 min-h-[36px] text-xs"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>

                    <Button
                      size="sm"
                      variant="default"
                      disabled={isProcessing}
                      onClick={() => handleDecision(q.id, "APPROVED")}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 min-h-[36px] text-xs font-bold"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
