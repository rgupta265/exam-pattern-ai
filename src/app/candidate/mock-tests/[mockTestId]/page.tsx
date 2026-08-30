import { notFound } from "next/navigation";
import { MockEngineService } from "@/services/mock/mock-engine.service";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartExamButton } from "./start-button";

export const dynamic = "force-dynamic";

export default async function CandidateMockDetailPage({
  params,
}: {
  params: Promise<{ mockTestId: string }>;
}) {
  const { mockTestId } = await params;
  let mock;
  try {
    mock = await MockEngineService.getMockTestById(mockTestId, true);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button href="/candidate/mock-tests" variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
          <ArrowLeft className="h-4 w-4" /> Back to Mock Tests
        </Button>
      </div>

      {/* Main Mock Lobby Header */}
      <Card className="shadow-sm border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline">{mock.type}</Badge>
            <Badge variant="success">Official Pattern Verified</Badge>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {mock.title}
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 mt-0.5">
            {mock.examVersion.exam.name} ({mock.examVersion.versionName}) • Authority: {mock.examVersion.exam.authority}
          </CardDescription>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-2 border-t border-slate-200/60 text-center">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block">Questions</span>
              <span className="text-xl font-bold text-slate-900">{mock.totalQuestions}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block">Total Marks</span>
              <span className="text-xl font-bold text-slate-900">{mock.totalMarks.toString()}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block">Duration</span>
              <span className="text-xl font-bold text-slate-900">{mock.durationMinutes} Mins</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-400 block">Negative Penalty</span>
              <span className="text-base font-bold text-red-600">
                {Number(mock.negativeRate) > 0 ? `-${mock.negativeRate.toString()} mark` : "Zero"}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sections Breakdown */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Examination Structure & Sections
          </CardTitle>
          <CardDescription className="text-xs">
            Pattern matches 100% of the locked official exam blueprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {mock.sections.map((sec) => (
              <div
                key={sec.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    Section {sec.sectionOrder}: {sec.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-700 font-semibold self-start sm:self-auto shrink-0">
                  <span>{sec.questions.length} Questions</span>
                  <span>{sec.marksPerQuestion.toString()} Mark/Q</span>
                  <span>(Neg: -{sec.negativeRate.toString()})</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Instructions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Important Instructions for Candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600">
          <p>• The clock will be synchronized with the server. When the timer reaches zero, the test will automatically submit.</p>
          <p>• Each question carries the marks indicated in the sectional header.</p>
          <p>• For each incorrect response, the negative penalty specified will be deducted from your total score.</p>
          <p>• You can navigate between sections and mark questions for review using the interactive palette.</p>
          <p>• Do not refresh or close your browser tab during the live exam attempt.</p>
        </CardContent>
      </Card>

      {/* Start Test CTA */}
      <div className="pt-2">
        <StartExamButton mockTestId={mock.id} />
      </div>
    </div>
  );
}
