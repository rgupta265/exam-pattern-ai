import { getServerSession } from "@/lib/auth";
import { CandidateShell } from "@/components/layouts/candidate-shell";

export const dynamic = "force-dynamic";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <CandidateShell
      userName={session?.fullName || "Candidate"}
      userEmail={session?.email || ""}
    >
      {children}
    </CandidateShell>
  );
}
