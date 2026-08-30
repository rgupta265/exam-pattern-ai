import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ mockTestId: string }>;
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  expected: string | number;
  actual: string | number;
  details?: string;
}

export default async function AdminMockValidationPage({ params }: PageProps) {
  const { mockTestId } = await params;

  const mock = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
    include: {
      examVersion: { include: { exam: true } },
      blueprint: true,
      validationResults: {
        orderBy: { validatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!mock) notFound();

  const latestValidation = mock.validationResults[0];
  const report = (latestValidation?.scoreReport as { checks?: ValidationCheck[] }) || {};
  const checks: ValidationCheck[] = report.checks || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/admin/mock-tests/${mock.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Mock Overview
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
              {mock.code}
            </span>
            <Badge
              variant={latestValidation?.isValid ? "default" : "destructive"}
              className="text-xs font-bold"
            >
              {latestValidation?.isValid ? "100% Pattern Compliant" : "Validation Non-Compliant"}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Pattern Validation Engine Audit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Official Blueprint: {mock.blueprint?.title || "Standard Locked Blueprint"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/mock-tests/${mock.id}/preview`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
          >
            <Eye className="h-3.5 w-3.5" /> Inspect Questions
          </Link>
        </div>
      </div>

      {/* Validation Checks Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Automated Blueprint Rules Check Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every mock must pass all mandatory checks prior to candidate release.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {checks.filter((c) => c.passed).length} / {checks.length || 6} Passed
          </span>
        </div>

        {checks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No validation records found for this mock test.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {checks.map((c, idx) => (
              <div key={idx} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {c.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.details || "Validated against authoritative locked blueprint specifications."}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Actual: <span className="font-mono font-bold">{c.actual}</span>
                  </div>
                  <div className="text-slate-400">
                    Expected: <span className="font-mono">{c.expected}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
