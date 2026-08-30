import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CandidateSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure language, notification preferences, and exam settings.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Preferences</CardTitle>
          <CardDescription>Customize exam language and responsive interface options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-slate-900">Default Exam Language</p>
              <p className="text-xs text-slate-500">English / Hindi switch for bilingual exams</p>
            </div>
            <span className="text-sm font-medium text-blue-600">English</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-slate-900">Timer Display Mode</p>
              <p className="text-xs text-slate-500">Show remaining time with server synchronization</p>
            </div>
            <span className="text-sm font-medium text-slate-700">Standard Countdown</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
