import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ mockTestId: string }>;
}

export default async function AdminMockPreviewPage({ params }: PageProps) {
  const { mockTestId } = await params;

  const mock = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
    include: {
      examVersion: { include: { exam: { include: { category: true } } } },
      sections: {
        orderBy: { sectionOrder: "asc" },
        include: {
          questions: {
            orderBy: { questionOrder: "asc" },
            include: {
              question: {
                include: {
                  options: { orderBy: { sortOrder: "asc" } },
                  topic: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mock) notFound();

  const exam = mock.examVersion.exam;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/admin/mock-tests/${mock.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Mock Overview
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
              {mock.code}
            </span>
            <Badge variant="outline" className="text-xs font-bold">
              {mock.status}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {mock.title} (Live Inspection Preview)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {exam.name} • {mock.sections.length} Sections • {mock.totalQuestions} Questions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/mock-tests/${mock.id}/validation`}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Pattern Checks
          </Link>
        </div>
      </div>

      {/* Sections and Questions */}
      <div className="space-y-8">
        {mock.sections.map((sec) => (
          <div key={sec.id} className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
              <div>
                <h2 className="text-base font-bold">
                  Section {sec.sectionOrder}: {sec.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {sec.questionCount} Questions • Marks per Q: {Number(sec.marksPerQuestion)} • Negative: -{Number(sec.negativeRate)}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs font-bold">
                {sec.questions.length} Items
              </Badge>
            </div>

            <div className="space-y-4">
              {sec.questions.map((mq) => {
                const q = mq.question;
                return (
                  <div
                    key={mq.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-blue-600">
                          Q{mq.questionOrder}.
                        </span>
                        <Badge variant="outline" className="text-[11px] font-bold">
                          {q.difficulty}
                        </Badge>
                        <span className="text-slate-500 font-medium">{q.topic?.name}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Marks: +{Number(mq.marks)} / -{Number(mq.negativeMarks)}
                      </span>
                    </div>

                    {/* Question Stems */}
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white text-base">
                        {q.questionText}
                      </p>
                      {q.questionTextHindi && (
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {q.questionTextHindi}
                        </p>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-start gap-2 ${
                            opt.isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="font-bold">{opt.optionKey}.</span>
                          <div className="space-y-0.5">
                            <div>{opt.optionText}</div>
                            {opt.optionTextHindi && (
                              <div className="text-slate-500 dark:text-slate-400 text-xs">
                                {opt.optionTextHindi}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <div className="font-bold text-blue-900 dark:text-blue-300">Explanation:</div>
                        <div>{q.explanation}</div>
                        {q.explanationHindi && (
                          <div className="pt-1 text-slate-600 dark:text-slate-400 border-t border-blue-100 dark:border-blue-900">
                            {q.explanationHindi}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
