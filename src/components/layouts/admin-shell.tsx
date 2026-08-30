"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/layouts/admin-header";
import { AdminSidebar } from "@/components/layouts/admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function AdminShell({
  children,
  userName,
  userEmail,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AdminHeader
        userName={userName}
        userEmail={userEmail}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] 2xl:max-w-[1800px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
