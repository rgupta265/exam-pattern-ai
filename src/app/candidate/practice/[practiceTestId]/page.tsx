"use client";

import { useEffect, useState, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  Award,
  Sparkles,
  Play,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

interface PracticeDetail {
  id: string;
  code: string;
  title: string;
  practiceType: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string;
  language: string;
  generationMode: string;
  status: string;
  createdAt: string;
  questions: Array<{
    id: string;
    questionOrder: number;
    questionText: string;
  }>;
}

export default function CandidatePracticeDetailPage({
  params,
}: {
  params: Promise<{ practiceTestId: string }>;
}) {
  const resolvedParams = use(params);
  const practiceTestId = resolvedParams.practiceTestId;
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const [drill, setDrill] = useState<PracticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDrill() {
      try {
        const res = await fetch(`/api/candidate/practice/${practiceTestId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setDrill(json.data);
        } else {
          setError(json.error?.message || "Practice drill not found.");
        }
      } catch {
        setError("Network error loading drill.");
      } finally {
        setLoading(false);
      }
    }

    loadDrill();
  }, [practiceTestId]);

  const handleStartAttempt = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch(`/api/candidate/practice/${practiceTestId}/attempt`, {
        method: "POST",
      });

      const json = await res.json();
      if (json.success && json.data?.attempt?.id) {
        router.push(localizePath(`/candidate/practice/${practiceTestId}/attempt`, locale));
      } else {
        setError(json.error?.message || "Failed to start practice attempt.");
        setIsStarting(false);
      }
    } catch {
      setError("Network error starting attempt.");
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mx-auto mb-3" />
        <p className="text-slate-600 text-sm font-medium">Loading practice drill...</p>
      </div>
    );
  }

  if (!drill || error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/candidate/practice" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Back to My Practice Drills
        </Link>
        <Card className="p-8 text-center bg-red-50 border-red-200">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <CardTitle className="text-lg font-bold text-red-900">Drill Unavailable</CardTitle>
          <CardDescription className="text-xs text-red-700 mt-1">{error || "Could not load this drill."}</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/candidate/practice"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Practice Drills
      </Link>

      {/* Main Card */}
      <Card className="shadow-md border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <Badge variant="outline" className="text-xs font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
              {drill.code}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {drill.practiceType.replace(/_/g, " ")}
            </Badge>
          </div>

          <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
            {drill.title}
          </CardTitle>
          <CardDescription className="text-xs">
            Created on {formatDate(drill.createdAt)} • Mode: {drill.generationMode.replace(/_/g, " ")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Parameters Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <span className="text-[11px] text-slate-500 block">Questions</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white">{drill.totalQuestions}</strong>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <span className="text-[11px] text-slate-500 block">Duration</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white">{drill.durationMinutes} Mins</strong>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <span className="text-[11px] text-slate-500 block">Difficulty</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white">{drill.difficulty}</strong>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <Sparkles className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <span className="text-[11px] text-slate-500 block">Language</span>
              <strong className="text-base font-bold text-slate-900 dark:text-white">{drill.language}</strong>
            </div>
          </div>

          {/* Practice Regulations Notice */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="h-4 w-4 text-blue-600" /> Practice Drill Regulations & Isolation
            </h4>
            <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
              <li>You may attempt this practice test multiple times to solidify your understanding.</li>
              <li>Each question carries 1 mark. There is zero negative marking penalty on custom practice drills.</li>
              <li>Detailed explanations and conceptual rationales will be provided upon submission.</li>
              <li>Practice test scorecards are private and strictly separated from your official mock test statistics.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button
            href="/candidate/practice"
            variant="ghost"
            className="w-full sm:w-auto font-semibold text-xs"
          >
            Back to Practice Drills
          </Button>

          <Button
            onClick={handleStartAttempt}
            disabled={isStarting}
            isLoading={isStarting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3 rounded-xl gap-2 min-h-[44px]"
          >
            <Play className="h-4 w-4 fill-white" /> Start Practice Drill Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
