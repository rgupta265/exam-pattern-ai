"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Zap, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

export function StartExamButton({ mockTestId }: { mockTestId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleStart = async () => {
    if (loading) return; // Prevent duplicate clicks
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/candidate/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockTestId }),
      });

      const data = await res.json();
      const attemptId = data.data?.attempt?.id || data.data?.id;

      if (data.success && attemptId) {
        // Direct to dedicated Instructions route with preserved locale
        const locale = getLocaleFromPath(pathname);
        router.push(localizePath(`/candidate/attempts/${attemptId}/instructions`, locale));
      } else {
        const errorMsg =
          data.error?.message ||
          "Unable to proceed with this examination. Please check if the mock test is active and published.";
        setError(errorMsg);
        setLoading(false);
      }
    } catch {
      setError("Network connection issue while starting examination. Please retry.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 font-medium"
        >
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        size="lg"
        disabled={loading}
        onClick={handleStart}
        className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg gap-2 cursor-pointer transition-all"
      >
        {loading ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-r-transparent rounded-full animate-spin" />
            <span>Setting up Exam Session...</span>
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 text-amber-300" />
            <span>Proceed to Examination Instructions</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
