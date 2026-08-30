import { notFound } from "next/navigation";
import Link from "next/link";
import { CandidateAdminService } from "@/services/candidate/candidate-admin.service";
import { CandidateAdminNavTabs } from "@/components/candidates/candidate-admin-nav-tabs";
import { ArrowLeft, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCandidateActivityPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  let activities;
  try {
    activities = await CandidateAdminService.getCandidateActivityLogs(candidateId);
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
            <Radio className="h-5 w-5 text-emerald-600 animate-pulse" /> Real-Time Interaction & Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center">No real-time activity events recorded.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        act.type === "ATTEMPT_EVENT" ? "bg-blue-600" : "bg-purple-600"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{act.eventType}</strong>
                        <Badge variant="outline" className="text-[10px]">
                          {act.type === "ATTEMPT_EVENT" ? "Attempt Event" : "Answer Event"}
                        </Badge>
                      </div>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        Mock: {act.mockTitle}
                      </span>
                    </div>
                  </div>

                  <span className="text-slate-400 font-mono text-[10px]">
                    {formatDate(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
