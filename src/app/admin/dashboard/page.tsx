import Link from "next/link";
import {
  GraduationCap,
  FileSpreadsheet,
  HelpCircle,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Control Center</h1>
            <Badge variant="warning">Phase 1</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Exam blueprint management, question review gates, and candidate audit visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/exams">
            <Button size="sm" className="flex items-center gap-1.5 font-semibold">
              <GraduationCap className="h-4 w-4" /> Manage Exams
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">Active Exams</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-500 mt-1">Ready for notification ingest</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">Locked Blueprints</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-500 mt-1">Authoritative patterns</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">Pending Reviews</CardTitle>
            <HelpCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">0</div>
            <p className="text-xs text-slate-500 mt-1">Questions awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">1</div>
            <p className="text-xs text-slate-500 mt-1">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Architecture Grid */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Authoritative Blueprint Lifecycle</CardTitle>
          <CardDescription>
            Official examination flow strictly configured as per AGENTS.md rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block">1. DRAFT</span>
              <span className="text-slate-500 mt-0.5 block">Document Upload</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-bold text-blue-900 block">2. AI_ANALYZED</span>
              <span className="text-blue-600 mt-0.5 block">Gemini Extraction</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="font-bold text-amber-900 block">3. UNDER_REVIEW</span>
              <span className="text-amber-600 mt-0.5 block">Admin Checking</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="font-bold text-indigo-900 block">4. VERIFIED</span>
              <span className="text-indigo-600 mt-0.5 block">Syllabus Match</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-bold text-purple-900 block">5. LOCKED</span>
              <span className="text-purple-600 mt-0.5 block">Immutable Spec</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-900 block">6. ACTIVE</span>
              <span className="text-emerald-600 mt-0.5 block">Mock Generation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
