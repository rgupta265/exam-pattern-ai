import { getServerSession } from "@/lib/auth";
import { AdminShell } from "@/components/layouts/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <AdminShell
      userName={session?.fullName || "Administrator"}
      userEmail={session?.email || ""}
    >
      {children}
    </AdminShell>
  );
}
