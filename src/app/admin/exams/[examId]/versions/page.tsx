"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface VersionItem {
  id: string;
  year: number;
  versionName: string;
  notificationNumber?: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminExamVersionsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.examId;

  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [examName, setExamName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [year, setYear] = useState(2026);
  const [versionName, setVersionName] = useState("2026 Regular");
  const [notificationNumber, setNotificationNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/versions`);
      const data = await res.json();
      if (data.success && data.data?.versions) {
        setVersions(data.data.versions);
      }
    } catch {
      console.error("Failed to load versions");
    }
  }, [examId]);

  const loadExam = useCallback(async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`);
      const data = await res.json();
      if (data.success && data.data?.exam) {
        setExamName(data.data.exam.name);
      }
    } catch {
      console.error("Failed to load exam");
    }
  }, [examId]);

  useEffect(() => {
    loadExam();
    loadVersions();
  }, [loadExam, loadVersions]);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/exams/${examId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          versionName,
          notificationNumber: notificationNumber || undefined,
          status: "DRAFT",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to create version");
        setIsLoading(false);
        return;
      }

      setIsCreateOpen(false);
      setIsLoading(false);
      setVersionName("");
      setNotificationNumber("");
      loadVersions();
    } catch {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/exams/${examId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 min-h-[36px]">
              <ArrowLeft className="h-4 w-4" /> Back to Exam Overview
            </Button>
          </Link>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 font-semibold min-h-[44px]"
        >
          <Plus className="h-4 w-4" /> Add Exam Version
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Exam Notification Cycles & Versions</CardTitle>
          <CardDescription>
            {examName ? `Versions for ${examName}` : "Manage historical and active exam notification cycles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{v.versionName}</span>
                    <Badge
                      variant={
                        v.status === "ACTIVE"
                          ? "success"
                          : v.status === "VERIFIED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {v.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>Year: <strong className="text-slate-800">{v.year}</strong></span>
                    {v.notificationNumber && (
                      <span>Notif #: <strong className="text-slate-800">{v.notificationNumber}</strong></span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(v.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/admin/exams/${examId}/documents`}>
                    <Button size="sm" variant="outline" className="text-xs min-h-[36px]">
                      Documents
                    </Button>
                  </Link>
                  <Link href={`/admin/exams/${examId}/blueprint`}>
                    <Button size="sm" variant="outline" className="text-xs min-h-[36px]">
                      Blueprint
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Version Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Exam Notification Version"
        description="Create a distinct cycle or corrigendum version (e.g. 2026 Regular or Corrigendum-1)"
      >
        <form onSubmit={handleCreateVersion} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="w-full">
            <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-1.5">
              Cycle Year
            </label>
            <input
              id="year"
              type="number"
              min="2000"
              max="2050"
              className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10);
                setYear(y);
                setVersionName(`${y} Regular`);
              }}
              required
            />
          </div>

          <Input
            id="versionName"
            label="Version Name"
            placeholder="e.g. 2026 Regular or Corrigendum-1"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            required
          />

          <Input
            id="notificationNumber"
            label="Official Notification Number (Optional)"
            placeholder="e.g. 05/Advt/2026"
            value={notificationNumber}
            onChange={(e) => setNotificationNumber(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Version
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
