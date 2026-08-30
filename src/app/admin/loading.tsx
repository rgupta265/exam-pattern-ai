import { Shield } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8 text-center" role="status" aria-live="polite">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin motion-reduce:animate-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
      </div>
      <p className="text-sm font-bold text-slate-800">ExamPattern AI Console</p>
      <p className="text-xs text-slate-500 mt-1">Loading administrative workspace...</p>
    </div>
  );
}
