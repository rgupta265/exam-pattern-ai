import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { LoadingProvider } from "@/components/common/loading-overlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamPattern AI — Official Blueprint-Verified AI Mock Tests",
  description:
    "Notification-driven AI mock test platform adhering strictly to verified official blueprints for competitive and government exams.",
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      hi: "/hi",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") || "en";

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col antialiased bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white"
        suppressHydrationWarning
      >
        <LoadingProvider>{children}</LoadingProvider>
      </body>
    </html>
  );
}
