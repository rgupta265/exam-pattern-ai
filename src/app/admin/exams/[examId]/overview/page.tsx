import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Locale, localizePath } from "@/lib/i18n";

export default async function ExamOverviewRedirect({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const headersList = await headers();
  const locale = (headersList.get("x-locale") || "en") as Locale;
  redirect(localizePath(`/admin/exams/${examId}`, locale));
}
