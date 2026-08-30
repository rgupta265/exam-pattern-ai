"use client";

import { useState } from "react";
import { CandidateHeader } from "@/components/layouts/candidate-header";
import { CandidateNav } from "@/components/layouts/candidate-nav";

interface CandidateShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function CandidateShell({
  children,
  userName,
  userEmail,
}: CandidateShellProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <CandidateHeader
        userName={userName}
        userEmail={userEmail}
        onToggleNav={() => setIsNavOpen(!isNavOpen)}
      />
      <div className="flex-1 flex">
        <CandidateNav
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] 2xl:max-w-[1800px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
