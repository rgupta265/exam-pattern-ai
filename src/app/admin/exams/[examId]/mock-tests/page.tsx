import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  Plus,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ examId: string }>;
}

export default async function AdminExamMockTestsPage({ params }: PageProps) {
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      category: true,
      versions: {
        where: { isActive: true },
        include: {
          mockTests: {
            where: { deletedAt: null },
            orderBy: [{ sequence: "asc" }, { createdAt: "desc" }],
            include: {
              _count: { select: { questions: true, sections: true, attempts: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!exam) notFound();

  const activeVersion = exam.versions[0];
  const mockTests = activeVersion?.mockTests || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/admin/exams`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Exams
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-blue-600 uppercase">{exam.category.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {exam.name} — Mock Tests
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Active Version: {activeVersion?.versionName || "2026 Regular"} • {mockTests.length} Mocks Configured
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/exams/${exam.id}/mock-tests/create`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Create / Generate Mock
          </Link>
        </div>
      </div>

      {/* Mocks Grid */}
      {mockTests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Mock Tests Created Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Generate authentic full-pattern mocks or topic drills strictly following the verified blueprint.
          </p>
          <Link
            href={`/admin/exams/${exam.id}/mock-tests/create`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm min-h-[44px]"
          >
            <Sparkles className="h-4 w-4" /> Generate First Mock
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockTests.map((mock) => (
            <div
              key={mock.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    {mock.code}
                  </span>
                  <Badge
                    variant={
                      mock.status === "PUBLISHED"
                        ? "default"
                        : mock.status === "VALIDATED"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[11px] font-bold"
                  >
                    {mock.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {mock.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {mock.description || `Pattern-compliant mock test #${mock.sequence} for ${exam.name}.`}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs">
                  <div>
                    <div className="text-slate-400 font-medium">Questions</div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      {mock.totalQuestions}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Duration</div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      {mock.durationMinutes}m
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Marks</div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      {Number(mock.totalMarks)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {mock._count.attempts} attempts
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/mock-tests/${mock.id}/validation`}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 min-h-[36px]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Checks
                  </Link>
                  <Link
                    href={`/admin/mock-tests/${mock.id}/preview`}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 min-h-[36px]"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
