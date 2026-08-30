import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamService } from "@/services/exam/exam.service";
import {
  Building2,
  UserCheck,
  Calendar,
  FileText,
  FileSpreadsheet,
  BookOpen,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  let exam;
  try {
    exam = await ExamService.getExamById(examId);
  } catch {
    notFound();
  }

  const latestVersion = exam.versions[0];
  const activeBlueprint = latestVersion?.blueprints[0];
  const activeSyllabus = latestVersion?.syllabi[0];
  const documents = latestVersion?.documents || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
              <ArrowLeft className="h-4 w-4" /> Back to Exams
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/exams/${exam.id}/documents`}>
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold min-h-[36px]">
              <FileText className="h-4 w-4 text-blue-600" /> Documents ({documents.length})
            </Button>
          </Link>
          <Link href={`/admin/exams/${exam.id}/blueprint`}>
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold min-h-[36px]">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Blueprint
            </Button>
          </Link>
          <Link href={`/admin/exams/${exam.id}/syllabus`}>
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold min-h-[36px]">
              <BookOpen className="h-4 w-4 text-purple-600" /> Syllabus
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Exam Overview Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{exam.category.name}</Badge>
                <Badge variant="secondary" className="font-mono">Code: {exam.code}</Badge>
                {latestVersion && (
                  <Badge
                    variant={
                      latestVersion.status === "ACTIVE"
                        ? "success"
                        : latestVersion.status === "VERIFIED"
                        ? "default"
                        : "warning"
                    }
                  >
                    Version {latestVersion.versionName} • {latestVersion.status}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-2">{exam.name}</CardTitle>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Authority</span>
                <span className="font-semibold text-slate-900">{exam.authority}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Designation / Post</span>
                <span className="font-semibold text-slate-900">{exam.postName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Created On</span>
                <span className="font-semibold text-slate-900">{formatDate(exam.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 3 Pillar Workflow Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Official Documents */}
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" /> Official Documents
              </CardTitle>
              <Badge variant="secondary">{documents.length}</Badge>
            </div>
            <CardDescription className="text-xs">
              Upload notification PDFs for Gemini AI pattern extraction.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {documents.slice(0, 3).map((d) => (
                  <div key={d.id} className="text-xs p-2 bg-slate-50 rounded border border-slate-200 truncate">
                    <span className="font-semibold text-slate-800">{d.title}</span>
                    <span className="block text-slate-400 text-[11px]">{d.documentType}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href={`/admin/exams/${exam.id}/documents`}>
              <Button size="sm" variant="outline" className="w-full font-semibold min-h-[36px]">
                Manage Documents
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 2. Exam Blueprint */}
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Exam Blueprint
              </CardTitle>
              {activeBlueprint && (
                <Badge variant={activeBlueprint.status === "LOCKED" ? "success" : "warning"}>
                  {activeBlueprint.status}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Mathematical specification of sections, questions, and negative rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activeBlueprint ? (
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1 mb-4">
                <p><span className="font-semibold text-slate-900">{activeBlueprint.totalQuestions}</span> Questions</p>
                <p><span className="font-semibold text-slate-900">{activeBlueprint.totalMarks.toString()}</span> Marks ({activeBlueprint.durationMinutes} mins)</p>
                <p>Negative marking: <span className="font-semibold text-slate-900">{activeBlueprint.hasNegativeMarking ? `${activeBlueprint.negativeMarkingRate} penalty` : "None"}</span></p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">No blueprint generated yet.</p>
            )}
            <Link href={`/admin/exams/${exam.id}/blueprint`}>
              <Button size="sm" variant="outline" className="w-full font-semibold min-h-[36px]">
                Review Blueprint
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 3. Verified Syllabus */}
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" /> Verified Syllabus
              </CardTitle>
              {activeSyllabus && (
                <Badge variant={activeSyllabus.isVerified ? "success" : "secondary"}>
                  {activeSyllabus.isVerified ? "VERIFIED" : "DRAFT"}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Structured subject, section, and topic hierarchy for pattern mocks.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activeSyllabus ? (
              <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-slate-700 space-y-1 mb-4">
                <p className="font-semibold text-slate-900">{activeSyllabus.title}</p>
                <p>{activeSyllabus.sections.length} Sections defined</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">No syllabus extracted yet.</p>
            )}
            <Link href={`/admin/exams/${exam.id}/syllabus`}>
              <Button size="sm" variant="outline" className="w-full font-semibold min-h-[36px]">
                Manage Syllabus
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Version History */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Notification Cycles & Versions</CardTitle>
            <CardDescription>Historical and active cycles for this examination</CardDescription>
          </div>
          <Link href={`/admin/exams/${exam.id}/versions`}>
            <Button size="sm" variant="outline" className="gap-1.5 min-h-[36px]">
              <Plus className="h-4 w-4" /> Manage Versions
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exam.versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{v.versionName}</span>
                    <Badge variant={v.status === "ACTIVE" ? "success" : "secondary"}>
                      {v.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Year {v.year} {v.notificationNumber ? `• Notif: ${v.notificationNumber}` : ""}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {formatDate(v.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
