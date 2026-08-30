"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Zap,
  Plus,
  Trash2,
  AlertTriangle,
  FilePlus2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface SectionState {
  name: string;
  sectionOrder: number;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  negativeRate: number;
  instructions?: string;
}

interface BlueprintData {
  id: string;
  versionNumber: number;
  title: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  hasNegativeMarking: boolean;
  negativeMarkingRate: number;
  status: "DRAFT" | "AI_ANALYZED" | "UNDER_REVIEW" | "VERIFIED" | "LOCKED" | "ACTIVE";
  instructions?: string | null;
  verifiedAt?: string | null;
  lockedAt?: string | null;
  verifiedBy?: { fullName: string; email: string } | null;
  lockedBy?: { fullName: string; email: string } | null;
  sections: SectionState[];
  rules: { ruleType: string; ruleConfig: Record<string, unknown>; description?: string }[];
}

export default function AdminExamBlueprintPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;

  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [examName, setExamName] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [totalMarks, setTotalMarks] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [hasNegativeMarking, setHasNegativeMarking] = useState(true);
  const [negativeMarkingRate, setNegativeMarkingRate] = useState(0.25);
  const [instructions, setInstructions] = useState("");
  const [sections, setSections] = useState<SectionState[]>([]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadBlueprint = useCallback(async () => {
    try {
      const examRes = await fetch(`/api/exams/${examId}`);
      const examData = await examRes.json();
      if (examData.success && examData.data?.exam) {
        setExamName(examData.data.exam.name);
        const latestVer = examData.data.exam.versions[0];
        if (latestVer?.blueprints?.[0]) {
          const bp = latestVer.blueprints[0];
          setBlueprint(bp);
          setTitle(bp.title);
          setTotalQuestions(bp.totalQuestions);
          setTotalMarks(Number(bp.totalMarks));
          setDurationMinutes(bp.durationMinutes);
          setHasNegativeMarking(bp.hasNegativeMarking);
          setNegativeMarkingRate(Number(bp.negativeMarkingRate));
          setInstructions(bp.instructions || "");
          setSections(
            bp.sections.map((s: SectionState) => ({
              name: s.name,
              sectionOrder: s.sectionOrder,
              questionCount: s.questionCount,
              marksPerQuestion: Number(s.marksPerQuestion),
              totalMarks: Number(s.totalMarks),
              negativeRate: Number(s.negativeRate),
              instructions: s.instructions || "",
            }))
          );
          setIsLocked(bp.status === "LOCKED" || bp.status === "ACTIVE");
        }
      }
    } catch {
      console.error("Failed to load blueprint");
    }
  }, [examId]);

  useEffect(() => {
    loadBlueprint();
  }, [loadBlueprint]);

  // Live Math Validation Check
  useEffect(() => {
    const errors: string[] = [];
    let sumQ = 0;
    let sumM = 0;

    sections.forEach((sec, idx) => {
      const label = `Section ${sec.sectionOrder || idx + 1}`;
      if (!sec.name.trim()) errors.push(`${label}: Name is required`);
      if (sec.questionCount <= 0) errors.push(`${label}: Question count must be > 0`);
      if (sec.marksPerQuestion <= 0) errors.push(`${label}: Marks per question must be > 0`);
      const expectedTotal = Number((sec.questionCount * sec.marksPerQuestion).toFixed(2));
      if (Math.abs(expectedTotal - sec.totalMarks) > 0.01) {
        errors.push(`${label}: Section marks mismatch (${sec.questionCount} × ${sec.marksPerQuestion} = ${expectedTotal}, but set to ${sec.totalMarks})`);
      }
      sumQ += sec.questionCount;
      sumM += sec.totalMarks;
    });

    if (sumQ !== totalQuestions) {
      errors.push(`Sum of section questions (${sumQ}) != Blueprint total (${totalQuestions})`);
    }
    if (Math.abs(sumM - totalMarks) > 0.01) {
      errors.push(`Sum of section marks (${sumM.toFixed(2)}) != Blueprint total (${totalMarks.toFixed(2)})`);
    }

    setValidationErrors(errors);
  }, [totalQuestions, totalMarks, sections]);

  const handleAddSection = () => {
    const nextOrder = sections.length + 1;
    setSections([
      ...sections,
      {
        name: `Section ${String.fromCharCode(64 + nextOrder)}: Subject Domain`,
        sectionOrder: nextOrder,
        questionCount: 20,
        marksPerQuestion: 1,
        totalMarks: 20,
        negativeRate: negativeMarkingRate,
        instructions: "",
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index).map((s, i) => ({ ...s, sectionOrder: i + 1 }));
    setSections(updated);
  };

  const handleUpdateSection = (index: number, field: keyof SectionState, value: string | number) => {
    const updated = [...sections];
    const item = { ...updated[index], [field]: value };
    if (field === "questionCount" || field === "marksPerQuestion") {
      item.totalMarks = Number((item.questionCount * item.marksPerQuestion).toFixed(2));
    }
    updated[index] = item;
    setSections(updated);
  };

  const handleSaveBlueprint = async () => {
    if (!blueprint) return;
    setIsSaving(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          totalQuestions,
          totalMarks,
          durationMinutes,
          hasNegativeMarking,
          negativeMarkingRate,
          instructions,
          sections,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error?.message || "Failed to save blueprint", type: "error" });
        setIsSaving(false);
        return;
      }

      setActionMessage({ text: "Blueprint changes saved successfully! Status: UNDER_REVIEW", type: "success" });
      setIsSaving(false);
      loadBlueprint();
    } catch {
      setActionMessage({ text: "Network error while saving blueprint", type: "error" });
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!blueprint) return;
    setIsSaving(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}/verify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error?.message || "Verification failed validation checks", type: "error" });
        setIsSaving(false);
        return;
      }

      setActionMessage({ text: "Blueprint verified successfully! Ready to be LOCKED.", type: "success" });
      setIsSaving(false);
      loadBlueprint();
    } catch {
      setActionMessage({ text: "Network error while verifying blueprint", type: "error" });
      setIsSaving(false);
    }
  };

  const handleLock = async () => {
    if (!blueprint) return;
    if (!confirm("Are you sure you want to LOCK this blueprint? Once locked, it becomes the immutable source of truth and direct modifications are permanently prevented.")) return;

    setIsSaving(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}/lock`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error?.message || "Failed to lock blueprint", type: "error" });
        setIsSaving(false);
        return;
      }

      setActionMessage({ text: "Blueprint LOCKED! Immutable authority active.", type: "success" });
      setIsSaving(false);
      loadBlueprint();
    } catch {
      setActionMessage({ text: "Network error while locking blueprint", type: "error" });
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!blueprint) return;
    setIsSaving(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}/activate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error?.message || "Failed to activate blueprint", type: "error" });
        setIsSaving(false);
        return;
      }

      setActionMessage({ text: "Blueprint ACTIVATED! Candidates can now view this official exam.", type: "success" });
      setIsSaving(false);
      loadBlueprint();
    } catch {
      setActionMessage({ text: "Network error while activating blueprint", type: "error" });
      setIsSaving(false);
    }
  };

  const handleCreateCorrigendum = async () => {
    if (!blueprint) return;
    const newTitle = prompt("Enter title for new Corrigendum / Amended Blueprint:", `Corrigendum Blueprint V${blueprint.versionNumber + 1}`);
    if (!newTitle) return;

    setIsSaving(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}/corrigendum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error?.message || "Failed to spawn corrigendum version", type: "error" });
        setIsSaving(false);
        return;
      }

      setActionMessage({ text: `Created draft Corrigendum Blueprint V${data.data?.blueprint?.versionNumber}! Historical locked data preserved.`, type: "success" });
      setIsSaving(false);
      loadBlueprint();
    } catch {
      setActionMessage({ text: "Network error while creating corrigendum", type: "error" });
      setIsSaving(false);
    }
  };

  if (!blueprint) {
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Blueprint Generated</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Upload an official notification document to trigger automatic Gemini extraction.
            </p>
            <div className="mt-6">
              <Link href={`/admin/exams/${examId}/documents`}>
                <Button size="sm">Upload Document & Extract</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/exams/${examId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
              <ArrowLeft className="h-4 w-4" /> Back to Exam
            </Button>
          </Link>
        </div>

        {/* Blueprint State Machine Action Controls */}
        <div className="flex flex-wrap gap-2">
          {!isLocked && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveBlueprint}
                disabled={isSaving}
                isLoading={isSaving}
                className="font-semibold min-h-[36px]"
              >
                Save Draft
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleVerify}
                disabled={isSaving || validationErrors.length > 0}
                className="gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 min-h-[36px]"
              >
                <CheckCircle2 className="h-4 w-4" /> Verify Blueprint
              </Button>

              {blueprint.status === "VERIFIED" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLock}
                  disabled={isSaving}
                  className="gap-1.5 font-semibold bg-purple-600 hover:bg-purple-700 min-h-[36px]"
                >
                  <Lock className="h-4 w-4" /> Lock Blueprint (Authoritative)
                </Button>
              )}
            </>
          )}

          {blueprint.status === "LOCKED" && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleActivate}
                disabled={isSaving}
                className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 min-h-[36px]"
              >
                <Zap className="h-4 w-4" /> Activate for Candidates
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateCorrigendum}
                disabled={isSaving}
                className="gap-1.5 font-semibold text-blue-700 border-blue-200 min-h-[36px]"
              >
                <FilePlus2 className="h-4 w-4 text-blue-600" /> Create Corrigendum Version
              </Button>
            </>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium border ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Blueprint Status Header Banner */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    blueprint.status === "ACTIVE"
                      ? "success"
                      : blueprint.status === "LOCKED"
                      ? "default"
                      : blueprint.status === "VERIFIED"
                      ? "default"
                      : "warning"
                  }
                  className="text-xs"
                >
                  Version {blueprint.versionNumber} • {blueprint.status}
                </Badge>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    <Lock className="h-3 w-3" /> Locked & Immutable
                  </span>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-2">{blueprint.title}</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Official Exam: {examName}
              </CardDescription>
            </div>

            {blueprint.lockedAt && (
              <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <p>Locked on: <strong>{formatDate(blueprint.lockedAt)}</strong></p>
                {blueprint.lockedBy && <p>Locked by: {blueprint.lockedBy.fullName}</p>}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Mathematical Validation Preview Banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-900 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Blueprint Math Validation Issues:
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Global Blueprint Configuration Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">1. Exam Aggregate Parameters</CardTitle>
          <CardDescription>Target question count, marks, and duration for full-pattern mock tests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="bpTitle"
            label="Blueprint Title"
            value={title}
            disabled={isLocked}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="w-full">
              <label htmlFor="totalQuestions" className="block text-sm font-medium text-slate-700 mb-1.5">Total Questions</label>
              <input
                id="totalQuestions"
                type="number"
                disabled={isLocked}
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="w-full">
              <label htmlFor="totalMarks" className="block text-sm font-medium text-slate-700 mb-1.5">Total Marks</label>
              <input
                id="totalMarks"
                type="number"
                disabled={isLocked}
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="w-full">
              <label htmlFor="durationMinutes" className="block text-sm font-medium text-slate-700 mb-1.5">Duration (Mins)</label>
              <input
                id="durationMinutes"
                type="number"
                disabled={isLocked}
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="w-full">
              <label htmlFor="negativeMarkingRate" className="block text-sm font-medium text-slate-700 mb-1.5">Penalty Deduction</label>
              <input
                id="negativeMarkingRate"
                type="number"
                step="0.05"
                min="0"
                max="1"
                disabled={isLocked}
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                value={negativeMarkingRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setNegativeMarkingRate(val);
                  setHasNegativeMarking(val > 0);
                }}
              />
            </div>
          </div>

          <div className="w-full">
            <label htmlFor="instructions" className="block text-sm font-medium text-slate-700 mb-1.5">Special Instructions / Marking Rules</label>
            <textarea
              id="instructions"
              disabled={isLocked}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 min-h-[70px] disabled:bg-slate-100"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections Table & Editor */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">2. Examination Sections Breakdown</CardTitle>
            <CardDescription>Sectional distribution, question counts, and marks per question</CardDescription>
          </div>
          {!isLocked && (
            <Button size="sm" variant="outline" onClick={handleAddSection} className="gap-1 text-xs min-h-[36px]">
              <Plus className="h-3.5 w-3.5" /> Add Section
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold shrink-0">
                      {sec.sectionOrder}
                    </span>
                    <input
                      type="text"
                      disabled={isLocked}
                      className="w-full font-bold text-sm bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent"
                      value={sec.name}
                      onChange={(e) => handleUpdateSection(idx, "name", e.target.value)}
                    />
                  </div>
                  {!isLocked && sections.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSection(idx)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 min-h-[32px]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label htmlFor={`sec-q-${idx}`} className="block text-slate-500 mb-1">Questions</label>
                    <input
                      id={`sec-q-${idx}`}
                      type="number"
                      disabled={isLocked}
                      className="w-full h-9 px-2 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                      value={sec.questionCount}
                      onChange={(e) => handleUpdateSection(idx, "questionCount", parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`sec-mpq-${idx}`} className="block text-slate-500 mb-1">Marks/Question</label>
                    <input
                      id={`sec-mpq-${idx}`}
                      type="number"
                      step="0.25"
                      disabled={isLocked}
                      className="w-full h-9 px-2 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                      value={sec.marksPerQuestion}
                      onChange={(e) => handleUpdateSection(idx, "marksPerQuestion", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`sec-tm-${idx}`} className="block text-slate-500 mb-1">Total Marks</label>
                    <input
                      id={`sec-tm-${idx}`}
                      type="number"
                      step="0.5"
                      disabled={isLocked}
                      className="w-full h-9 px-2 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                      value={sec.totalMarks}
                      onChange={(e) => handleUpdateSection(idx, "totalMarks", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`sec-nr-${idx}`} className="block text-slate-500 mb-1">Section Penalty</label>
                    <input
                      id={`sec-nr-${idx}`}
                      type="number"
                      step="0.05"
                      disabled={isLocked}
                      className="w-full h-9 px-2 rounded border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                      value={sec.negativeRate}
                      onChange={(e) => handleUpdateSection(idx, "negativeRate", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
