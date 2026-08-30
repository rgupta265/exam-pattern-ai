import { BookOpen } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-8 text-center" role="status" aria-live="polite">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-blue-500/30 border-t-blue-600 animate-spin motion-reduce:animate-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-700">ExamPattern AI</p>
      <p className="text-xs text-slate-400 mt-1">Loading...</p>
    </div>
  );
}
