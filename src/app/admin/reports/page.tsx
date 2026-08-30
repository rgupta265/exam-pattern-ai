import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Exam Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          System-wide performance benchmarks, topic difficulty indexes, and candidate retention analytics.
        </p>
      </div>

      <EmptyState
        icon={<BarChart3 className="h-7 w-7" />}
        title="Aggregate Reports"
        description="Exam analytics and discrimination index reports will populate as test attempts occur."
      />
    </div>
  );
}
