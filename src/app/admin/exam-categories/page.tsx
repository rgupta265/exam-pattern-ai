import Link from "next/link";
import { ExamCategoryService } from "@/services/exam/exam-category.service";
import { Layers, Plus, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminExamCategoriesPage() {
  const categories = await ExamCategoryService.getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Exam Categories</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage broad examination domains and job verticals (e.g. Government, Medical, Banking).
          </p>
        </div>
        <Link href="/admin/exam-categories/create">
          <Button className="flex items-center gap-1.5 font-semibold w-full sm:w-auto min-h-[44px]">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Exam Categories</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Create your first category (e.g. &quot;Government Jobs&quot;, &quot;Medical&quot;) to start adding exams.
            </p>
            <div className="mt-6">
              <Link href="/admin/exam-categories/create">
                <Button size="sm">Create Category</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <Card key={cat.id} className="shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                      {cat.icon || <Layers className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{cat.name}</CardTitle>
                      <span className="text-xs font-mono text-slate-400">/{cat.slug}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {cat._count.exams} {cat._count.exams === 1 ? "Exam" : "Exams"}
                  </Badge>
                </div>
                <CardDescription className="mt-2 text-xs line-clamp-2">
                  {cat.description || "No description provided."}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Created {formatDate(cat.createdAt)}
                  </span>
                  <Link
                    href={`/admin/exam-categories/${cat.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline min-h-[36px] py-1"
                  >
                    Edit <ExternalLink className="h-3 w-3" />
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
