import { Metadata } from "next";
import { DatabaseManagement } from "@/components/admin/database-management";

export const metadata: Metadata = {
  title: "Database & Data Management | ExamPattern AI Admin",
  description: "Secure database backup, controlled testing data reset, and fresh seed management.",
};

export default function AdminDatabasePage() {
  return <DatabaseManagement />;
}
