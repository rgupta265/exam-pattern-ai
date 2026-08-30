import * as React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
        {icon || <FolderOpen className="h-7 w-7" />}
      </div>
      <h3 className="text-base md:text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionLabel && (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
