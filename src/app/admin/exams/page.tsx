import Link from "next/link";
import { ExamService } from "@/services/exam/exam.service";
import { ExamCategoryService } from "@/services/exam/exam-category.service";
import { GraduationCap, Plus, ExternalLink, Calendar, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;

  const [examsResult, categories] = await Promise.all([
    ExamService.getExams({
      search: resolvedParams.search,
      categoryId: resolvedParams.categoryId,
      page,
      pageSize: 12,
    }),
    ExamCategoryService.getAllCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Exams & Versions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain official examination entities, versions, blueprints, and syllabi.
          </p>
        </div>
        <Link href="/admin/exams/create">
          <Button className="flex items-center gap-1.5 font-semibold w-full sm:w-auto min-h-[44px]">
            <Plus className="h-4 w-4" /> Create New Exam
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <form method="GET" className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                name="search"
                defaultValue={resolvedParams.search || ""}
                placeholder="Search exams by name, authority, or post..."
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full sm:w-56">
              <select
                name="categoryId"
                defaultValue={resolvedParams.categoryId || ""}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" className="w-full sm:w-auto min-h-[44px]">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Exam Grid */}
      {examsResult.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Exams Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Create an exam under an existing category to upload official notifications.
            </p>
            <div className="mt-6">
              <Link href="/admin/exams/create">
                <Button size="sm">Create Exam</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {examsResult.items.map((exam) => {
            const latestVersion = exam.versions[0];
            const activeBlueprint = latestVersion?.blueprints[0];

            return (
              <Card key={exam.id} className="shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs bg-slate-50">
                      {exam.category.name}
                    </Badge>
                    {latestVersion && (
                      <Badge
                        variant={
                          latestVersion.status === "ACTIVE"
                            ? "success"
                            : latestVersion.status === "VERIFIED"
                            ? "default"
                            : latestVersion.status === "UNDER_REVIEW"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {latestVersion.versionName} • {latestVersion.status}
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                    {exam.name}
                  </CardTitle>
                  <span className="text-xs font-mono text-slate-400">Code: {exam.code}</span>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{exam.authority}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{exam.postName}</span>
                    </div>
                  </div>

                  {activeBlueprint && (
                    <div className="mt-3 p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900 flex justify-between">
                      <span>{activeBlueprint.totalQuestions} Questions</span>
                      <span>{activeBlueprint.totalMarks.toString()} Marks</span>
                      <span>{activeBlueprint.durationMinutes} mins</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Added {formatDate(exam.createdAt)}
                    </span>
                    <Link
                      href={`/admin/exams/${exam.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline min-h-[36px] py-1"
                    >
                      Manage <ExternalLink className="h-3 w-3" />
                    </Link>
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
