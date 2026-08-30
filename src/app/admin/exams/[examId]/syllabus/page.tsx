"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface TopicItem {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  weightagePercentage?: number | null;
  sortOrder: number;
}

interface SectionItem {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder: number;
  topics: TopicItem[];
}

interface SyllabusData {
  id: string;
  title: string;
  isVerified: boolean;
  verifiedAt?: string | null;
  verifiedBy?: { fullName: string; email: string } | null;
  sections: SectionItem[];
}

export default function AdminExamSyllabusPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;

  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [examName, setExamName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadSyllabus = useCallback(async () => {
    try {
      const examRes = await fetch(`/api/exams/${examId}`);
      const examData = await examRes.json();
      if (examData.success && examData.data?.exam) {
        setExamName(examData.data.exam.name);
        const latestVer = examData.data.exam.versions[0];
        if (latestVer?.syllabi?.[0]) {
          setSyllabus(latestVer.syllabi[0]);
        }
      }
    } catch {
      console.error("Failed to load syllabus");
    }
  }, [examId]);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  const handleVerifySyllabus = async () => {
    if (!syllabus) return;
    setIsVerifying(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/syllabi/${syllabus.id}/verify`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ text: data.error?.message || "Failed to verify syllabus", type: "error" });
        setIsVerifying(false);
        return;
      }

      setMessage({ text: "Syllabus successfully verified by admin!", type: "success" });
      setIsVerifying(false);
      loadSyllabus();
    } catch {
      setMessage({ text: "Network error while verifying syllabus", type: "error" });
      setIsVerifying(false);
    }
  };

  if (!syllabus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/admin/exams/${examId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
              <ArrowLeft className="h-4 w-4" /> Back to Exam Overview
            </Button>
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-4">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Syllabus Extracted</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Upload an official syllabus or notification document to automatically extract the syllabus hierarchy.
            </p>
            <div className="mt-6">
              <Link href={`/admin/exams/${examId}/documents`}>
                <Button size="sm">Upload Syllabus Document</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/exams/${examId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
              <ArrowLeft className="h-4 w-4" /> Back to Exam
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!syllabus.isVerified && (
            <Button
              variant="default"
              size="sm"
              onClick={handleVerifySyllabus}
              disabled={isVerifying}
              isLoading={isVerifying}
              className="gap-1.5 font-semibold bg-purple-600 hover:bg-purple-700 min-h-[36px]"
            >
              <CheckCircle2 className="h-4 w-4" /> Verify Syllabus
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Syllabus Header */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={syllabus.isVerified ? "success" : "secondary"}>
                  {syllabus.isVerified ? "VERIFIED SYLLABUS" : "DRAFT (NEEDS VERIFICATION)"}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-2">{syllabus.title}</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Official Examination: {examName}
              </CardDescription>
            </div>

            {syllabus.verifiedAt && (
              <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <p>Verified on: <strong>{formatDate(syllabus.verifiedAt)}</strong></p>
                {syllabus.verifiedBy && <p>Verified by: {syllabus.verifiedBy.fullName}</p>}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Sections and Topics Tree Hierarchy */}
      <div className="space-y-4">
        {syllabus.sections.map((sec, secIdx) => (
          <Card key={sec.id || secIdx} className="shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
                    {sec.sortOrder || secIdx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">{sec.name}</CardTitle>
                    {sec.code && <span className="text-xs font-mono text-slate-400">Code: {sec.code}</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {sec.topics.length} Topics
                </Badge>
              </div>
              {sec.description && (
                <CardDescription className="text-xs mt-1 text-slate-600">
                  {sec.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="pt-4">
              <div className="space-y-2.5">
                {sec.topics.map((topic, topIdx) => (
                  <div
                    key={topic.id || topIdx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 w-6">
                        {sec.sortOrder || secIdx + 1}.{topic.sortOrder || topIdx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-sm text-slate-800">{topic.name}</span>
                        {topic.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                        )}
                      </div>
                    </div>

                    {topic.weightagePercentage && (
                      <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                        ~{topic.weightagePercentage}% Weightage
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
