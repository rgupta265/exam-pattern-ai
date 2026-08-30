import { ExamService } from "@/services/exam/exam.service";
import { ExamCategoryService } from "@/services/exam/exam-category.service";
import {
  GraduationCap,
  Building2,
  UserCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CandidateExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string; authority?: string; postName?: string; year?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const year = resolvedParams.year ? parseInt(resolvedParams.year, 10) : undefined;

  const [examsResult, categories] = await Promise.all([
    ExamService.getExams({
      search: resolvedParams.search,
      categoryId: resolvedParams.categoryId,
      authority: resolvedParams.authority,
      postName: resolvedParams.postName,
      year,
      page,
      pageSize: 12,
      isCandidateFacing: true,
    }),
    ExamCategoryService.getAllCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Official Examinations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore officially verified exam patterns, syllabi, and full-pattern AI mock tests.
        </p>
      </div>

      {/* Filter / Search Controls */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
            <div className="w-full sm:col-span-2">
              <input
                type="text"
                name="search"
                defaultValue={resolvedParams.search || ""}
                placeholder="Search by exam name, code, or post..."
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-full">
              <select
                name="categoryId"
                defaultValue={resolvedParams.categoryId || ""}
                aria-label="Filter by Category"
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

            <Button type="submit" className="w-full h-11 font-semibold flex items-center justify-center gap-1.5">
              <Search className="h-4 w-4" /> Search Exams
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
            <h3 className="text-lg font-bold text-slate-900">No Verified Exams Match Your Search</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Try adjusting your search criteria or category filter to discover available exams.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {examsResult.items.map((exam) => {
            const latestVer = exam.versions[0];
            const blueprint = latestVer?.blueprints[0];

            return (
              <Card key={exam.id} className="shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs bg-slate-50">
                      {exam.category.name}
                    </Badge>
                    <Badge variant="success" className="text-xs">
                      {latestVer?.year} Verified
                    </Badge>
                  </div>

                  <CardTitle className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">
                    {exam.name}
                  </CardTitle>

                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{exam.authority}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{exam.postName}</span>
                    </div>
                  </div>

                  {blueprint && (
                    <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-center text-xs">
                      <div>
                        <span className="block text-slate-400 text-[10px]">Questions</span>
                        <strong className="text-slate-900 font-bold">{blueprint.totalQuestions}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">Marks</span>
                        <strong className="text-slate-900 font-bold">{blueprint.totalMarks.toString()}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">Duration</span>
                        <strong className="text-slate-900 font-bold">{blueprint.durationMinutes}m</strong>
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <div className="border-t border-slate-100 pt-3">
                    <Button href={`/candidate/exams/${exam.id}`} className="w-full font-semibold min-h-[44px]">
                      View Verified Pattern & Syllabus
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
