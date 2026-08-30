"use client";

import React, { createContext, useContext, useState, useCallback, useTransition } from "react";
import { BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { getLocaleFromPath, getTranslations } from "@/lib/i18n";

interface LoadingContextType {
  isLoading: boolean;
  loadingText: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(
    promiseOrFn: Promise<T> | (() => Promise<T>),
    message?: string
  ) => Promise<T>;
  startTransitionLoading: (callback: () => void, message?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeRequests, setActiveRequests] = useState(0);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  const showLoading = useCallback((message?: string) => {
    setActiveRequests((prev) => prev + 1);
    if (message) {
      setCustomMessage(message);
    }
  }, []);

  const hideLoading = useCallback(() => {
    setActiveRequests((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        setCustomMessage(null);
      }
      return next;
    });
  }, []);

  const withLoading = useCallback(
    async <T,>(
      promiseOrFn: Promise<T> | (() => Promise<T>),
      message?: string
    ): Promise<T> => {
      showLoading(message);
      try {
        if (typeof promiseOrFn === "function") {
          return await promiseOrFn();
        }
        return await promiseOrFn;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  const startTransitionLoading = useCallback(
    (callback: () => void, message?: string) => {
      showLoading(message);
      startTransition(() => {
        try {
          callback();
        } finally {
          hideLoading();
        }
      });
    },
    [showLoading, hideLoading]
  );

  const isLoading = activeRequests > 0;
  const currentText = customMessage || t("common.loading", "Loading...");

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingText: currentText,
        showLoading,
        hideLoading,
        withLoading,
        startTransitionLoading,
      }}
    >
      {children}
      {isLoading && <GlobalLoadingOverlay message={currentText} />}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

export function GlobalLoadingOverlay({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-200 px-4 select-none"
    >
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl max-w-sm w-full text-center">
        {/* Animated Brand Mark */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute -inset-3 rounded-full bg-blue-500/20 blur-lg animate-pulse motion-reduce:animate-none" />
          {/* Spinner ring */}
          <div className="h-16 w-16 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin motion-reduce:animate-none" />
          {/* Logo center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <h3 className="text-sm font-extrabold tracking-wider uppercase text-blue-400 mb-1.5">
          ExamPattern AI
        </h3>

        {/* Message */}
        <p className="text-sm font-semibold text-slate-200 leading-relaxed max-w-xs break-words">
          {message}
        </p>

        {/* Subtitle assurance */}
        <p className="text-[11px] text-slate-500 mt-3 font-medium">
          Official Pattern Engine
        </p>
      </div>
    </div>
  );
}
