"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  FileText,
  Clock,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface PracticeItem {
  id: string;
  code: string;
  title: string;
  practiceType: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string;
  language: string;
  status: string;
  createdAt: string;
  _count?: {
    questions: number;
    attempts: number;
  };
  attempts?: Array<{
    id: string;
    status: string;
    submittedAt: string | null;
    result?: {
      id: string;
      score: number;
      totalMarks: number;
      accuracyRate: number;
      percentage: number;
    } | null;
  }>;
}

export default function CandidatePracticeListPage() {
  const [practiceTests, setPracticeTests] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPracticeTests() {
      try {
        const res = await fetch("/api/candidate/practice");
        const json = await res.json();
        if (json.success && json.data) {
          setPracticeTests(json.data);
        }
      } catch {
        console.error("Failed to load practice tests");
      } finally {
        setLoading(false);
      }
    }

    loadPracticeTests();
  }, []);

  const totalAttempts = practiceTests.reduce(
    (acc, t) => acc + (t._count?.attempts || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Independent Candidate Practice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Practice Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
            Generate unlimited practice drills from your notes, PDFs, DOCX files, or study web links. Practice results are tracked separately from official mocks.
          </p>
        </div>

        <Button
          href="/candidate/practice/create"
          className="bg-white hover:bg-slate-100 text-blue-900 font-extrabold gap-2 px-5 py-3 rounded-xl shadow-md min-h-[44px]"
        >
          <Plus className="h-4 w-4" /> Create Practice Drill
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Drills Created</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{practiceTests.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Attempts</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalAttempts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Separation Guarantee</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Independent Scorecards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practice Tests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" /> My Practice Drills
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {practiceTests.length} drills available
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Loading your practice drills...</p>
          </div>
        ) : practiceTests.length === 0 ? (
          <Card className="text-center p-8 bg-white dark:bg-slate-900 border-dashed">
            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">No Practice Drills Yet</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-1 mb-4 text-xs">
              Upload your notes, paste study text, or input an approved study link to generate your first custom practice drill.
            </CardDescription>
            <Button href="/candidate/practice/create" className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
              <Plus className="h-4 w-4" /> Create Your First Practice Drill
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {practiceTests.map((drill) => {
              const latestAttempt = drill.attempts?.[0];
              const latestResult = latestAttempt?.result;

              return (
                <div
                  key={drill.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase bg-slate-50 dark:bg-slate-800">
                        {drill.code}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {drill.practiceType.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                        {drill.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Created {formatDate(drill.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1 font-semibold">
                        <FileText className="h-3.5 w-3.5 text-blue-600" /> {drill.totalQuestions} Qs
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="h-3.5 w-3.5 text-amber-600" /> {drill.durationMinutes}m
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Award className="h-3.5 w-3.5 text-purple-600" /> {drill.difficulty}
                      </span>
                    </div>

                    {latestResult && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                          Latest Score: {Number(latestResult.score)} / {Number(latestResult.totalMarks)}
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {Number(latestResult.accuracyRate).toFixed(1)}% Accuracy
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-2 flex items-center gap-2">
                    <Button
                      href={`/candidate/practice/${drill.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold text-xs gap-1.5 min-h-[40px]"
                    >
                      Start Practice <ChevronRight className="h-4 w-4" />
                    </Button>
                    {latestResult && (
                      <Button
                        href={`/candidate/practice/results/${latestResult.id}`}
                        variant="outline"
                        size="sm"
                        className="font-semibold text-xs min-h-[40px]"
                      >
                        View Result
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
