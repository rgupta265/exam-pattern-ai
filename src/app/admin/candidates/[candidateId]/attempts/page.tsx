import { notFound } from "next/navigation";
import Link from "next/link";
import { CandidateAdminService } from "@/services/candidate/candidate-admin.service";
import { CandidateAdminNavTabs } from "@/components/candidates/candidate-admin-nav-tabs";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCandidateAttemptsPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  let attempts;
  try {
    attempts = await CandidateAdminService.getCandidateAttempts(candidateId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href={`/admin/candidates/${candidateId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to Candidate Profile
          </Button>
        </Link>
      </div>

      <CandidateAdminNavTabs candidateId={candidateId} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" /> Exam Attempts Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center">No test attempts found.</p>
          ) : (
            <div className="space-y-3">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{att.mockTest.title}</h3>
                      <Badge variant={att.status === "SUBMITTED" || att.status === "AUTO_SUBMITTED" ? "success" : "warning"}>
                        {att.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Started: {formatDate(att.startedAt)}
                      </span>
                      {att.submittedAt && (
                        <span>Submitted: {formatDate(att.submittedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {att.testResult && (
                      <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg text-xs">
                        Score: {Number(att.testResult.netScore).toFixed(1)} / {Number(att.testResult.totalMarks)}
                      </span>
                    )}
                    <Link href={`/admin/candidates/${candidateId}/attempts/${att.id}`}>
                      <Button size="sm" variant="default" className="text-xs font-semibold min-h-[36px]">
                        Inspect Audit Trail
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
