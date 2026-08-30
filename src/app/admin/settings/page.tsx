import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings & Health</h1>
        <p className="text-sm text-slate-500 mt-1">
          Infrastructure configurations, storage abstractions, and AI service status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Environment & Database</CardTitle>
            <CardDescription>MySQL 8 with Prisma ORM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Database Engine</span>
              <span className="font-semibold text-slate-900">MySQL 8.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">ORM Provider</span>
              <span className="font-semibold text-slate-900">Prisma ORM</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Architecture</span>
              <Badge variant="secondary">Modular Monolith</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Storage & AI Services</CardTitle>
            <CardDescription>Local filesystem & Gemini abstraction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Storage Provider</span>
              <span className="font-semibold text-slate-900">LocalStorageProvider (V1)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">AI Service</span>
              <span className="font-semibold text-slate-900">Google Gemini API (Server-side)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Phase Status</span>
              <Badge variant="success">Phase 1 Foundation Ready</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
