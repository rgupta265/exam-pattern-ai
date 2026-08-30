import { EmptyState } from "@/components/ui/empty-state";
import { History } from "lucide-react";

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable audit logs of exam pattern changes, document uploads, and security operations.
        </p>
      </div>

      <EmptyState
        icon={<History className="h-7 w-7" />}
        title="Audit Logging Active"
        description="Every critical administrative and security action is recorded to the audit_logs table."
      />
    </div>
  );
}
