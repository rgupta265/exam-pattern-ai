"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionOptionData {
  id?: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

export default function AdminQuestionDetailPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const resolvedParams = use(params);
  const questionId = resolvedParams.questionId;

  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [status, setStatus] = useState("DRAFT");
  const [marks, setMarks] = useState(1.0);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [options, setOptions] = useState<QuestionOptionData[]>([]);
  const [topicName, setTopicName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadQuestion() {
      try {
        const res = await fetch(`/api/questions/${questionId}`);
        const data = await res.json();
        if (data.success && data.data?.question) {
          const q = data.data.question;
          setQuestionText(q.questionText);
          setExplanation(q.explanation || "");
          setDifficulty(q.difficulty);
          setStatus(q.status);
          setMarks(Number(q.marks));
          setNegativeMarks(Number(q.negativeMarks));
          setTopicName(q.topic?.name || "");
          setOptions(q.options || []);
        }
      } catch {
        setMessage({ text: "Failed to load question details", type: "error" });
      } finally {
        setIsFetching(false);
      }
    }
    loadQuestion();
  }, [questionId]);

  const handleOptionChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx].optionText = text;
    setOptions(updated);
  };

  const handleSetCorrect = (idx: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx,
    }));
    setOptions(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText,
          explanation,
          difficulty,
          status,
          marks,
          negativeMarks,
          options,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Failed to update question", type: "error" });
        setIsLoading(false);
        return;
      }

      setMessage({ text: "Question updated successfully!", type: "success" });
      setIsLoading(false);
    } catch {
      setMessage({ text: "Network error while saving question", type: "error" });
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-center text-slate-500">Loading question details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button href="/admin/questions" variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> Back to Question Bank
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

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={status === "APPROVED" ? "success" : "warning"}>{status}</Badge>
              <Badge variant="outline">{difficulty}</Badge>
            </div>
            {topicName && <span className="text-xs text-slate-500 font-semibold">Topic: {topicName}</span>}
          </div>
          <CardTitle className="text-xl font-bold mt-2">Edit Question</CardTitle>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="w-full">
              <label htmlFor="qText" className="block text-sm font-medium text-slate-700 mb-1.5">Question Text</label>
              <textarea
                id="qText"
                className="flex w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Options & Correct Answer</label>
              {options.map((opt, i) => (
                <div key={opt.optionKey} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={opt.isCorrect}
                    onChange={() => handleSetCorrect(i)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                  />
                  <span className="font-bold text-sm text-slate-700 w-6">{opt.optionKey}.</span>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                    value={opt.optionText}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="diffSelect" className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  id="diffSelect"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label htmlFor="statusSelect" className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  id="statusSelect"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label htmlFor="marksInput" className="block text-xs font-semibold text-slate-700 mb-1">Marks</label>
                <input
                  id="marksInput"
                  type="number"
                  step="0.25"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  value={marks}
                  onChange={(e) => setMarks(parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="w-full">
              <label htmlFor="expText" className="block text-sm font-medium text-slate-700 mb-1.5">Explanation</label>
              <textarea
                id="expText"
                className="flex w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Link href="/admin/questions">
              <Button type="button" variant="outline">
                Back
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading} className="font-semibold">
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
