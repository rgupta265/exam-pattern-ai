import Link from "next/link";
import { QuestionService } from "@/services/question/question.service";
import { HelpCircle, Plus, CheckCircle2, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; difficulty?: string; status?: string; source?: string; page?: string; success?: string; count?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;

  const result = await QuestionService.getQuestions({
    search: resolvedParams.search,
    difficulty: resolvedParams.difficulty as "EASY" | "MEDIUM" | "HARD" | undefined,
    status: resolvedParams.status as "DRAFT" | "AI_GENERATED" | "AI_VALIDATED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED" | undefined,
    source: resolvedParams.source as "MANUAL" | "AI_GENERATED" | "PREVIOUS_YEAR" | "IMPORTED" | undefined,
    page,
    pageSize: 15,
  });

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {resolvedParams.success === "created" && (
        <div
          role="status"
          className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 text-sm font-bold shadow-xs"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Question created successfully and saved to Question Bank.</span>
        </div>
      )}

      {resolvedParams.success === "generated" && (
        <div
          role="status"
          className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 text-sm font-bold shadow-xs"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            {resolvedParams.count ? `${resolvedParams.count} questions generated successfully` : "Questions generated successfully"} with Gemini AI and added to Question Bank.
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, create, AI-generate, and review verified examination items mapped to official syllabi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button href="/admin/question-reviews" variant="outline" className="gap-1.5 font-semibold min-h-[44px]">
            Review Queue
          </Button>
          <Button href="/admin/questions/create" className="flex items-center gap-1.5 font-semibold min-h-[44px]">
            <Plus className="h-4 w-4" /> Add / Generate Questions
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
            <div className="md:col-span-2">
              <input
                type="text"
                name="search"
                defaultValue={resolvedParams.search || ""}
                placeholder="Search question text or explanations..."
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                name="difficulty"
                defaultValue={resolvedParams.difficulty || ""}
                aria-label="Filter by Difficulty"
                className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <select
                name="status"
                defaultValue={resolvedParams.status || ""}
                aria-label="Filter by Status"
                className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="AI_GENERATED">AI Generated</option>
                <option value="DRAFT">Draft</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <Button type="submit" variant="secondary" className="w-full h-11 flex items-center justify-center gap-1.5 font-semibold">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Questions List */}
      {result.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <HelpCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Questions Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Create your first question or trigger Gemini AI question generation for a syllabus topic.
            </p>
            <div className="mt-6">
              <Link href="/admin/questions/create">
                <Button size="sm">Create Question</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.items.map((q) => (
            <Card key={q.id} className="shadow-sm hover:border-slate-300 transition-all">
              <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={q.status === "APPROVED" ? "success" : q.status === "REJECTED" ? "destructive" : "warning"}>
                      {q.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {q.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {q.source}
                    </Badge>
                    {q.isHumanVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Human Verified
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                    {q.questionText}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Topic: <strong className="text-slate-800">{q.topic.name}</strong></span>
                    <span>Section: {q.topic.section.name}</span>
                    <span>Marks: {q.marks.toString()} (Neg: {q.negativeMarks.toString()})</span>
                    <span>Options: {q.options.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button href={`/admin/questions/${q.id}`} size="sm" variant="outline" className="gap-1.5 text-xs font-semibold min-h-[36px]">
                    <Eye className="h-3.5 w-3.5" /> Details / Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
