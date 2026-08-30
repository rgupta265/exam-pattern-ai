import Link from "next/link";
import { BookOpen } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { LanguageSwitcher } from "@/components/common/language-switcher";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 relative">
      {/* Top Locale Switcher Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <Link href="/en" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <span>ExamPattern AI</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <RegisterForm />
    </div>
  );
}
