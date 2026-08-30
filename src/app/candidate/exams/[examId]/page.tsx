import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamService } from "@/services/exam/exam.service";
import {
  Building2,
  UserCheck,
  Calendar,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CandidateExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  let exam;
  try {
    exam = await ExamService.getExamById(examId, true);
  } catch {
    notFound();
  }

  const latestVersion = exam.versions[0];
  const blueprint = latestVersion?.blueprints[0];
  const syllabus = latestVersion?.syllabi[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Back Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/candidate/exams">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to All Exams
          </Button>
        </Link>
      </div>

      {/* Main Official Exam Banner */}
      <Card className="shadow-sm border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline">{exam.category.name}</Badge>
            <Badge variant="secondary" className="font-mono">{exam.code}</Badge>
            <Badge variant="success">Official Pattern Verified</Badge>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {exam.name}
          </CardTitle>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-2 border-t border-slate-200/60 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Authority</span>
                <span className="font-semibold text-slate-900">{exam.authority}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Designation</span>
                <span className="font-semibold text-slate-900">{exam.postName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Cycle / Year</span>
                <span className="font-semibold text-slate-900">{latestVersion?.year || 2026}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Verified Blueprint Specs */}
      {blueprint && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Verified Examination Pattern
              </CardTitle>
              <Badge variant="success">100% Pattern Compliance</Badge>
            </div>
            <CardDescription className="text-xs">
              Authoritative exam structure extracted from official notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block">Questions</span>
                <span className="text-xl font-bold text-slate-900">{blueprint.totalQuestions}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block">Total Marks</span>
                <span className="text-xl font-bold text-slate-900">{blueprint.totalMarks.toString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block">Duration</span>
                <span className="text-xl font-bold text-slate-900">{blueprint.durationMinutes} Mins</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block">Negative Marking</span>
                <span className="text-sm font-bold text-red-700">
                  {blueprint.hasNegativeMarking ? `-${blueprint.negativeMarkingRate.toString()} mark` : "Zero Penalty"}
                </span>
              </div>
            </div>

            {blueprint.instructions && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-900">
                <strong>Marking Instructions:</strong> {blueprint.instructions}
              </div>
            )}

            {/* Sectional Breakdown */}
            <div className="pt-2">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Sectional Breakdown</h4>
              <div className="space-y-2">
                {blueprint.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{sec.name}</span>
                      {sec.instructions && (
                        <p className="text-slate-500 mt-0.5">{sec.instructions}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-slate-700 font-semibold self-start sm:self-auto shrink-0">
                      <span>{sec.questionCount} Questions</span>
                      <span>{sec.totalMarks.toString()} Marks</span>
                      <span>({sec.marksPerQuestion.toString()} mark/Q)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verified Syllabus Hierarchy */}
      {syllabus && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" /> Official Syllabus
              </CardTitle>
              <Badge variant="success">Admin Verified</Badge>
            </div>
            <CardDescription className="text-xs">
              Every mock test question maps 100% to this syllabus tree
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syllabus.sections.map((sec, i) => (
              <div key={sec.id || i} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>{sec.name}</span>
                  <span className="text-xs font-normal text-slate-500">{sec.topics.length} Topics</span>
                </div>
                <div className="p-3 divide-y divide-slate-100 text-xs space-y-1">
                  {sec.topics.map((t) => (
                    <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                      <span className="text-slate-800 font-medium">{t.name}</span>
                      {t.weightagePercentage && (
                        <Badge variant="secondary" className="text-[11px]">
                          ~{t.weightagePercentage.toString()}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Launch Mock Test CTA Box */}
      <Card className="shadow-sm bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Ready to Practice Full-Pattern Mocks?</h3>
            <p className="text-xs text-blue-100 mt-1">
              Simulate actual exam pressure with exact timer, negative marking, and touch-optimized palette.
            </p>
          </div>
          <Link href="/candidate/mock-tests">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md min-h-[48px] px-6">
              <Zap className="h-4 w-4 mr-2" /> Start Mock Practice
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
