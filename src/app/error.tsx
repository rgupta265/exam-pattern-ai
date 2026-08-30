"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-5 shadow-sm">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        An unexpected error occurred while processing your request. Our technical team has been notified.
      </p>
      {error.message && process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-mono rounded-lg max-w-lg text-left overflow-auto border border-red-200">
          {error.message}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Button onClick={() => reset()} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" href="/">
          Go to Home
        </Button>
      </div>
    </div>
  );
}
