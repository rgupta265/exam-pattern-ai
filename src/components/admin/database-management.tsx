"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPath, getTranslations } from "@/lib/i18n";
import { useLoading } from "@/components/common/loading-overlay";
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  Server,
  Layers,
  FileCheck,
  AlertTriangle,
  History,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DatabaseStatus {
  environment: string;
  database: string;
  host: string;
  port: number;
  status: "connected" | "disconnected";
  tablesCount: number;
  totalRows: number;
  backupsCount: number;
  currentOperation: "IDLE" | "BACKUP" | "CLEAN" | "SEED";
  serverTime: string;
}

interface BackupItem {
  id: string;
  filename: string;
  sizeFormatted: string;
  databaseName: string;
  environment: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  tablesCount: number;
  rowsCount: number;
  errorMessage?: string;
  createdAt: string;
  createdBy?: { fullName: string; email: string };
}

interface CleanPreview {
  mode: "TEST_DATA" | "ALL_DATA";
  candidatesCount: number;
  candidateProfilesCount: number;
  attemptsCount: number;
  resultsCount: number;
  practiceTestsCount: number;
  mockTestsCount: number;
  questionsCount: number;
  documentsCount: number;
  examsCount: number;
  adminsPreservedCount: number;
  isProduction: boolean;
  requiredConfirmationPhrase: string;
}

export function DatabaseManagement() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);
  const { withLoading } = useLoading();

  const [activeTab, setActiveTab] = useState<"status" | "backups" | "clean" | "seed">("status");
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [cleanPreview, setCleanPreview] = useState<CleanPreview | null>(null);
  const [cleanMode, setCleanMode] = useState<"TEST_DATA" | "ALL_DATA">("TEST_DATA");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Clean Modal States
  const [isCleanModalOpen, setIsCleanModalOpen] = useState(false);
  const [cleanStep, setCleanStep] = useState<1 | 2 | 3>(1);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeletingBackupId, setIsDeletingBackupId] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/database/status");
      const json = await res.json();
      if (json.success) setStatus(json.data);
    } catch {
      console.error("Failed to load database status");
    }
  }, []);

  const loadBackups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/database/backups");
      const json = await res.json();
      if (json.success) setBackups(json.data);
    } catch {
      console.error("Failed to load database backups");
    }
  }, []);

  const loadCleanPreview = useCallback(async (mode: "TEST_DATA" | "ALL_DATA") => {
    try {
      const res = await fetch(`/api/admin/database/clean/preview?mode=${mode}`);
      const json = await res.json();
      if (json.success) setCleanPreview(json.data);
    } catch {
      console.error("Failed to load clean preview");
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStatus(), loadBackups(), loadCleanPreview(cleanMode)]);
  }, [loadStatus, loadBackups, loadCleanPreview, cleanMode]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle Backup Creation
  const handleCreateBackup = async () => {
    setFeedback(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/admin/database/backups", { method: "POST" });
        const json = await res.json();
        if (json.success) {
          setFeedback({
            type: "success",
            message: `Database backup created successfully: ${json.data.filename} (${(json.data.sizeBytes / (1024 * 1024)).toFixed(2)} MB, ${json.data.tablesCount} tables, ${json.data.rowsCount} rows)`,
          });
          refreshAll();
          setActiveTab("backups");
        } else {
          setFeedback({
            type: "error",
            message: json.error?.message || "Failed to create database backup.",
          });
        }
      } catch {
        setFeedback({ type: "error", message: "Network error creating database backup." });
      }
    }, "Generating full MySQL database backup archive...");
  };

  // Handle Backup Delete
  const handleDeleteBackup = async (backupId: string) => {
    setFeedback(null);
    await withLoading(async () => {
      try {
        const res = await fetch(`/api/admin/database/backups/${backupId}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          setFeedback({ type: "success", message: "Backup archive deleted safely." });
          setIsDeletingBackupId(null);
          refreshAll();
        } else {
          setFeedback({ type: "error", message: json.error?.message || "Could not delete backup." });
        }
      } catch {
        setFeedback({ type: "error", message: "Network error deleting backup." });
      }
    }, "Deleting backup archive...");
  };

  // Handle Clean Execution
  const handleExecuteClean = async () => {
    if (!cleanPreview) return;
    setFeedback(null);
    setIsCleanModalOpen(false);

    await withLoading(async () => {
      try {
        const res = await fetch("/api/admin/database/clean", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: cleanMode,
            confirmationPhrase: confirmationInput,
          }),
        });

        const json = await res.json();
        if (json.success) {
          setFeedback({
            type: "success",
            message: `Data cleaning completed: ${json.data.candidatesRemoved} candidate accounts & all test attempts reset safely. Admin users preserved.`,
          });
          setConfirmationInput("");
          setCleanStep(1);
          refreshAll();
        } else {
          setFeedback({
            type: "error",
            message: json.error?.message || "Data cleaning operation failed.",
          });
        }
      } catch {
        setFeedback({ type: "error", message: "Network error executing data cleaning." });
      }
    }, "Cleaning application test records safely...");
  };

  // Handle Fresh Seed
  const handleExecuteSeed = async () => {
    setFeedback(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/admin/database/seed", { method: "POST" });
        const json = await res.json();
        if (json.success) {
          setFeedback({
            type: "success",
            message: "Authoritative fresh seed data populated successfully (Candidate Count = 0, Admin Preserved).",
          });
          refreshAll();
        } else {
          setFeedback({
            type: "error",
            message: json.error?.message || "Fresh data seed failed.",
          });
        }
      } catch {
        setFeedback({ type: "error", message: "Network error executing fresh seed." });
      }
    }, "Populating authoritative fresh application data...");
  };

  const isProduction = status?.environment === "production";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              {t("database.title", "Database & Data Management")}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isProduction
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {isProduction ? "PRODUCTION DATABASE" : "DEVELOPMENT ENVIRONMENT"}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {t(
              "database.subtitle",
              "Server-side MySQL backups, controlled application reset, and fresh seed management."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            onClick={refreshAll}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            onClick={handleCreateBackup}
            size="sm"
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab("status")}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "status"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Server className="h-4 w-4" />
          Infrastructure & Status
        </button>

        <button
          onClick={() => setActiveTab("backups")}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "backups"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="h-4 w-4" />
          Backups & Archives ({backups.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("clean");
            loadCleanPreview(cleanMode);
          }}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "clean"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Clean & Reset Data
        </button>

        <button
          onClick={() => setActiveTab("seed")}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "seed"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Fresh Data Seed
        </button>
      </div>

      {/* TAB 1: INFRASTRUCTURE & STATUS */}
      {activeTab === "status" && status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Database Connection</CardDescription>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {status.status.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              MySQL 8 Managed via Prisma ORM
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Configured Database</CardDescription>
              <CardTitle className="text-base font-bold text-slate-900 truncate">
                {status.database}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 truncate">
              Host: {status.host}:{status.port}
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Tables & Data Rows</CardDescription>
              <CardTitle className="text-base font-bold text-slate-900">
                {status.tablesCount} Tables
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              ~{status.totalRows.toLocaleString()} Estimated Records
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Active Operation Lock</CardDescription>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-slate-400" />
                {status.currentOperation}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              Concurrency Lock Safe
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-4 shadow-xs border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                Security & Isolation Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>
                  <strong>Zero Client Credential Exposure:</strong> Database passwords and full connection strings never leave the server layer.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>
                  <strong>Candidate Data Isolation:</strong> Candidate records reside strictly segregated with role-gated RBAC authorization.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>
                  <strong>Private Storage:</strong> Database backups are saved in <code className="bg-slate-200 px-1 py-0.5 rounded">./storage/private/backups/</code> with direct public URL access strictly blocked.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: BACKUPS & ARCHIVES */}
      {activeTab === "backups" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Create Full Database Backup</h3>
              <p className="text-xs text-slate-500">
                Generates a clean server-side standard MySQL 8 SQL dump archive stored privately.
              </p>
            </div>
            <Button
              onClick={handleCreateBackup}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Backup Now
            </Button>
          </div>

          {backups.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-slate-300">
              <CardContent className="space-y-3">
                <Database className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No database backups created yet.</p>
                <p className="text-xs text-slate-500">
                  Click &quot;Create Backup&quot; above to create your first archive.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {backups.map((b) => (
                <Card key={b.id} className="shadow-xs border-slate-200 hover:border-slate-300 transition-all">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{b.filename}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800 animate-pulse"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Size: <strong>{b.sizeFormatted}</strong></span>
                        <span>•</span>
                        <span>Tables: <strong>{b.tablesCount}</strong></span>
                        <span>•</span>
                        <span>Rows: <strong>{b.rowsCount.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Date: {new Date(b.createdAt).toLocaleString()}</span>
                        {b.createdBy && (
                          <>
                            <span>•</span>
                            <span>Created by: {b.createdBy.fullName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {b.status === "COMPLETED" && (
                        <a
                          href={`/api/admin/database/backups/${b.id}/download`}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download SQL
                        </a>
                      )}
                      <Button
                        onClick={() => setIsDeletingBackupId(b.id)}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLEAN & RESET DATA */}
      {activeTab === "clean" && cleanPreview && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Controlled Data Cleaning & Testing Reset
            </div>
            <p>
              This operation safely removes candidate test attempts, scorecards, and testing records.
              <strong> Super Admin and Admin accounts are strictly protected and will NOT be deleted.</strong>
            </p>
          </div>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">1. Select Reset Scope</CardTitle>
              <CardDescription className="text-xs">
                Choose whether to reset candidate testing records only, or all catalog items.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCleanMode("TEST_DATA");
                    loadCleanPreview("TEST_DATA");
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    cleanMode === "TEST_DATA"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 mb-1">
                    Candidate & Test Data Only (Recommended)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Cleans candidates, live exam attempts, answers, event logs, and practice tests. Preserves official exam catalog & blueprints.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCleanMode("ALL_DATA");
                    loadCleanPreview("ALL_DATA");
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    cleanMode === "ALL_DATA"
                      ? "border-red-600 bg-red-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-xs text-red-900 mb-1">
                    All Application Data
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Cleans candidates, attempts, practice tests, questions, mock tests, and exam entities. Preserves Admin accounts & system schema.
                  </p>
                </button>
              </div>

              {/* Record Count Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  Data Records to be Permanently Removed:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Candidate Users:</span>
                    <strong className="text-slate-900 text-sm">{cleanPreview.candidatesCount}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Exam Attempts:</span>
                    <strong className="text-slate-900 text-sm">{cleanPreview.attemptsCount}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Test Results:</span>
                    <strong className="text-slate-900 text-sm">{cleanPreview.resultsCount}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Practice Tests:</span>
                    <strong className="text-slate-900 text-sm">{cleanPreview.practiceTestsCount}</strong>
                  </div>
                  {cleanMode === "ALL_DATA" && (
                    <>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block">Mock Tests:</span>
                        <strong className="text-slate-900 text-sm">{cleanPreview.mockTestsCount}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block">Questions:</span>
                        <strong className="text-slate-900 text-sm">{cleanPreview.questionsCount}</strong>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block">Exams:</span>
                        <strong className="text-slate-900 text-sm">{cleanPreview.examsCount}</strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Admin Accounts Preserved: {cleanPreview.adminsPreservedCount} (Cannot be deleted)</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    setCleanStep(1);
                    setConfirmationInput("");
                    setIsCleanModalOpen(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Proceed to Clean Confirmation...
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: FRESH SEED DATA */}
      {activeTab === "seed" && (
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Authoritative Fresh Seed Engine</CardTitle>
            <CardDescription className="text-xs">
              Populates initial official categories, verified blueprints, and syllabus entities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
              <div className="font-bold text-slate-900">Fresh Seed Policy:</div>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>Super Admin is configured from environment variables (<code className="bg-slate-200 px-1 py-0.5 rounded">ADMIN_SEED_EMAIL</code>).</li>
                <li><strong>Zero Candidate Seed Data:</strong> Candidate count remains strictly 0.</li>
                <li>Idempotent execution prevents duplicate records on repeat runs.</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Admin Users:</span>
                <strong className="text-slate-900 text-sm">1 (Protected)</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Candidate Users:</span>
                <strong className="text-emerald-700 text-sm font-black">0 (Zero Seed)</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Exam Categories:</span>
                <strong className="text-slate-900 text-sm">2 Categories</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Official Mocks:</span>
                <strong className="text-slate-900 text-sm">4 Verified Mocks</strong>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleExecuteSeed}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
              >
                <FileCheck className="h-4 w-4" />
                Seed Fresh Application Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MULTI-STEP CLEAN MODAL */}
      {isCleanModalOpen && cleanPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Confirm Data Cleaning ({cleanStep}/2)
              </h2>
            </div>

            {cleanStep === 1 ? (
              <div className="space-y-3 text-xs text-slate-600">
                <p>
                  Before executing this destructive data reset, we strongly recommend creating a fresh database backup.
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Affected Entities ({cleanMode}):</span>
                  <span>Candidates: {cleanPreview.candidatesCount} | Attempts: {cleanPreview.attemptsCount} | Results: {cleanPreview.resultsCount}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <Button
                    onClick={async () => {
                      await handleCreateBackup();
                      setCleanStep(2);
                    }}
                    className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Create Backup & Continue
                  </Button>
                  <Button
                    onClick={() => setCleanStep(2)}
                    variant="outline"
                    className="w-full sm:w-auto text-xs"
                  >
                    Continue Without Backup
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="text-slate-800 font-semibold">
                  To confirm permanent deletion, type the confirmation phrase below:
                </p>
                <div className="bg-slate-100 p-2.5 rounded-lg font-mono text-center font-bold text-slate-900 select-all">
                  {cleanPreview.requiredConfirmationPhrase}
                </div>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={`Type "${cleanPreview.requiredConfirmationPhrase}"`}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-red-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    onClick={() => setIsCleanModalOpen(false)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteClean}
                    disabled={confirmationInput !== cleanPreview.requiredConfirmationPhrase}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    Execute Permanent Clean
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BACKUP DELETE CONFIRMATION MODAL */}
      {isDeletingBackupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <Trash2 className="h-8 w-8 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Delete Backup Archive?</h3>
            <p className="text-xs text-slate-500">
              This action cannot be undone. The backup SQL file will be permanently removed from server storage.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => setIsDeletingBackupId(null)}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteBackup(isDeletingBackupId)}
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
