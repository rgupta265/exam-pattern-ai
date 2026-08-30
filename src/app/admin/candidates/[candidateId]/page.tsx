import { notFound } from "next/navigation";
import Link from "next/link";
import { CandidateAdminService } from "@/services/candidate/candidate-admin.service";
import { CandidateAdminNavTabs } from "@/components/candidates/candidate-admin-nav-tabs";
import { ArrowLeft, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCandidateOverviewPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  let candidate;
  try {
    candidate = await CandidateAdminService.getCandidateById(candidateId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/admin/candidates">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
            <ArrowLeft className="h-4 w-4" /> Back to Candidates
          </Button>
        </Link>
      </div>

      {/* Sub-nav Tabs */}
      <CandidateAdminNavTabs candidateId={candidateId} />

      {/* Profile Overview Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {candidate.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{candidate.fullName}</h1>
                <Badge variant="outline">Candidate</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {candidate.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(candidate.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center shrink-0">
            <span className="text-xs text-blue-600 font-semibold block">Total Exam Attempts</span>
            <strong className="text-xl font-bold text-blue-950">{candidate.testAttempts.length}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attempts Snapshot */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">Recent Exam Attempts</CardTitle>
          <Link href={`/admin/candidates/${candidateId}/attempts`} className="text-xs font-semibold text-blue-600 hover:underline">
            View All Attempts
          </Link>
        </CardHeader>
        <CardContent>
          {candidate.testAttempts.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">No test attempts recorded for this candidate.</p>
          ) : (
            <div className="space-y-3">
              {candidate.testAttempts.map((att) => (
                <div
                  key={att.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{att.mockTest.title}</h3>
                    <p className="text-slate-500 mt-0.5">
                      Started {formatDate(att.startedAt)} • Status: <strong className="text-slate-700">{att.status}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {att.testResult && (
                      <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                        Score: {Number(att.testResult.netScore).toFixed(1)} / {Number(att.testResult.totalMarks)}
                      </span>
                    )}
                    <Link href={`/admin/candidates/${candidateId}/attempts/${att.id}`}>
                      <Button size="sm" variant="outline" className="text-xs font-semibold min-h-[36px]">
                        Inspect Attempt
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
