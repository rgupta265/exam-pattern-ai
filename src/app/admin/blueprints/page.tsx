import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FileSpreadsheet, ExternalLink, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBlueprintsListPage() {
  const blueprints = await prisma.examBlueprint.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      examVersion: {
        include: {
          exam: { include: { category: true } },
        },
      },
      sections: { orderBy: { sectionOrder: "asc" } },
      verifiedBy: { select: { fullName: true } },
      lockedBy: { select: { fullName: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Exam Blueprints</h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative examination patterns, section distributions, and immutable locks.
          </p>
        </div>
        <Link href="/admin/exams">
          <Button variant="outline" className="gap-1.5 font-semibold min-h-[44px]">
            Browse Exams
          </Button>
        </Link>
      </div>

      {blueprints.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Blueprints Created</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Upload an official notification under an exam to extract its blueprint.
            </p>
            <div className="mt-6">
              <Link href="/admin/exams">
                <Button size="sm">Go to Exams</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blueprints.map((bp) => (
            <Card key={bp.id} className="shadow-sm hover:border-slate-300 transition-all">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-base">{bp.title}</span>
                    <Badge
                      variant={
                        bp.status === "ACTIVE"
                          ? "success"
                          : bp.status === "LOCKED"
                          ? "default"
                          : bp.status === "VERIFIED"
                          ? "default"
                          : "warning"
                      }
                      className="text-xs"
                    >
                      {bp.status} (V{bp.versionNumber})
                    </Badge>
                    {bp.status === "LOCKED" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">
                    Exam: <strong className="text-slate-900">{bp.examVersion.exam.name}</strong> ({bp.examVersion.versionName}) • Category: {bp.examVersion.exam.category.name}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Questions: <strong>{bp.totalQuestions}</strong></span>
                    <span>Marks: <strong>{bp.totalMarks.toString()}</strong></span>
                    <span>Duration: <strong>{bp.durationMinutes} mins</strong></span>
                    <span>Sections: <strong>{bp.sections.length}</strong></span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(bp.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/admin/exams/${bp.examVersion.examId}/blueprint`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold min-h-[36px]">
                      Review & Manage <ExternalLink className="h-3 w-3" />
                    </Button>
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
