import Link from "next/link";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { ExamService } from "@/services/exam/exam.service";
import { FileCheck, Plus, ExternalLink, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMockTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;

  const [mockResult, examsResult] = await Promise.all([
    MockEngineService.getMockTests({
      search: resolvedParams.search,
      status: resolvedParams.status as "DRAFT" | "GENERATING" | "VALIDATED" | "VALIDATION_FAILED" | "PUBLISHED" | "ARCHIVED" | undefined,
      page,
      pageSize: 12,
    }),
    ExamService.getExams({ page: 1, pageSize: 20 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mock Tests Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, validate against verified blueprints, and publish candidate-ready mock exams.
          </p>
        </div>
      </div>

      {/* Quick Generate Full Mock for Active Exams */}
      <Card className="shadow-sm border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" /> Full Mock Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-600 mb-3">
            Select an exam to generate a full-pattern mock test strictly following its locked official blueprint.
          </p>
          <div className="flex flex-wrap gap-2">
            {examsResult.items.map((exam) => (
              <Link key={exam.id} href={`/admin/exams/${exam.id}/blueprint`}>
                <Button size="sm" variant="outline" className="gap-1.5 bg-white text-xs font-semibold min-h-[36px]">
                  <Plus className="h-3.5 w-3.5" /> Generate for {exam.name}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mock Tests List */}
      {mockResult.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <FileCheck className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Mock Tests Generated</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Open an active exam blueprint to generate your first full-pattern AI mock test.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockResult.items.map((mock) => (
            <Card key={mock.id} className="shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs">
                    {mock.type}
                  </Badge>
                  <Badge
                    variant={
                      mock.status === "PUBLISHED"
                        ? "success"
                        : mock.status === "VALIDATED"
                        ? "default"
                        : mock.status === "VALIDATION_FAILED"
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {mock.status}
                  </Badge>
                </div>

                <CardTitle className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">
                  {mock.title}
                </CardTitle>

                <p className="text-xs text-slate-500 mt-0.5">
                  {mock.examVersion.exam.name} ({mock.examVersion.versionName})
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs">
                  <div>
                    <span className="block text-slate-400 text-[10px]">Questions</span>
                    <strong className="text-slate-900 font-bold">{mock.totalQuestions}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Marks</span>
                    <strong className="text-slate-900 font-bold">{mock.totalMarks.toString()}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Duration</span>
                    <strong className="text-slate-900 font-bold">{mock.durationMinutes}m</strong>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(mock.createdAt)}
                  </span>
                  <Link
                    href={`/admin/mock-tests/${mock.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline min-h-[36px] py-1"
                  >
                    Manage & Validate <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
