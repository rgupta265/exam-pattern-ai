import { notFound } from "next/navigation";
import Link from "next/link";
import { ResultService } from "@/services/result/result.service";
import { getServerSession } from "@/lib/auth";
import { ResultNavTabs } from "@/components/results/result-nav-tabs";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CandidateResultQuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ resultId: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await getServerSession();
  const { resultId } = await params;
  const resolvedSearchParams = await searchParams;

  if (!session) return notFound();

  const filterStatus = (resolvedSearchParams.status?.toUpperCase() || "ALL") as
    | "ALL"
    | "CORRECT"
    | "INCORRECT"
    | "UNANSWERED"
    | "MARKED";
  const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;

  let questionsData;
  try {
    questionsData = await ResultService.getDetailedQuestions(resultId, session.id, {
      status: filterStatus,
      page,
      pageSize: 20,
    });
  } catch {
    notFound();
  }

  const filterTabs = [
    { label: "All Questions", value: "ALL" },
    { label: "Correct", value: "CORRECT" },
    { label: "Incorrect", value: "INCORRECT" },
    { label: "Unanswered", value: "UNANSWERED" },
    { label: "Marked for Review", value: "MARKED" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button href={`/candidate/results/${resultId}`} variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> Back to Scorecard
        </Button>
      </div>

      {/* Sub-route Navigation Tabs */}
      <ResultNavTabs resultId={resultId} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {filterTabs.map((f) => {
          const isActive = filterStatus === f.value;
          return (
            <Link
              key={f.value}
              href={`/candidate/results/${resultId}/questions?status=${f.value}`}
              className={`px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap min-h-[38px] flex items-center transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Question Review List */}
      {questionsData.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 text-center text-slate-500">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-sm">No questions matching filter &quot;{filterStatus}&quot;</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questionsData.items.map((qr, idx) => {
            const q = qr.question;
            const marksAwarded = Number(qr.marksAwarded);

            return (
              <Card key={qr.id} className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-slate-700">
                        Q{(page - 1) * 20 + idx + 1}.
                      </span>
                      {qr.isCorrect ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Correct (+{marksAwarded})
                        </Badge>
                      ) : qr.isAttempted ? (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Incorrect ({marksAwarded})
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unanswered (0.0)</Badge>
                      )}

                      {qr.isMarkedForReview && (
                        <Badge variant="warning" className="gap-1">
                          <Bookmark className="h-3 w-3" /> Marked
                        </Badge>
                      )}
                      <span className="text-xs text-slate-500 font-semibold">{q.topic.name}</span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Time: {qr.timeSpentSeconds}s
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Question Stem */}
                  <p className="font-bold text-slate-900 text-sm sm:text-base leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Options List with evaluation highlighting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {q.options.map((opt) => {
                      const isCandidatePick = qr.selectedOptionId === opt.id;
                      const isOfficialCorrect = opt.isCorrect || opt.optionKey === qr.correctOptionKey;

                      let optClasses = "bg-white border-slate-200 text-slate-700";
                      if (isOfficialCorrect) {
                        optClasses = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold";
                      } else if (isCandidatePick && !qr.isCorrect) {
                        optClasses = "bg-red-50 border-red-400 text-red-950 font-bold";
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${optClasses}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-bold w-5">{opt.optionKey}.</span>
                            <span>{opt.optionText}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 font-semibold text-[10px]">
                            {isCandidatePick && (
                              <span className="text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                Your Pick
                              </span>
                            )}
                            {isOfficialCorrect && (
                              <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Correct
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step-by-Step Explanation */}
                  {q.explanation && (
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1">
                      <strong className="text-blue-900 block font-bold">Educational Solution & Step-by-Step Rationale:</strong>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
