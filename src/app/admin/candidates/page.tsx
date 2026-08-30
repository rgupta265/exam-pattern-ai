import Link from "next/link";
import { CandidateAdminService } from "@/services/candidate/candidate-admin.service";
import { Users, Search, ExternalLink, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;

  const result = await CandidateAdminService.getCandidates({
    search: resolvedParams.search,
    page,
    pageSize: 15,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Candidate Monitoring Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor registered candidates, inspect live and past exam attempts, and view audit event streams.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <form method="GET" className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={resolvedParams.search || ""}
                placeholder="Search candidate name or email..."
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" variant="secondary" className="h-11 px-5 font-semibold">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Candidates List */}
      {result.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Candidates Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              No registered candidate accounts match your search criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.items.map((cand) => (
            <Card key={cand.id} className="shadow-sm hover:border-slate-300 transition-all">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-slate-900 text-base">{cand.fullName}</h2>
                    <Badge variant="outline" className="text-xs">Candidate</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{cand.email}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                      <BookOpen className="h-3.5 w-3.5" /> {cand._count.testAttempts} Attempts
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" /> Registered {formatDate(cand.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link href={`/admin/candidates/${cand.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 font-semibold text-xs min-h-[36px]">
                      View Profile & Attempts <ExternalLink className="h-3 w-3" />
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
