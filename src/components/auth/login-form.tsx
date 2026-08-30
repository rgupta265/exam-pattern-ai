"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";

export function LoginForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const locale = getLocaleFromPath(pathname);
  const { t } = getTranslations(locale);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || t("errors.invalidCredentials"));
        setIsLoading(false);
        return;
      }

      // Check role to direct to correct dashboard with preserved locale
      const roles = data.data?.user?.roles || [];
      const defaultDashboard =
        roles.includes("SUPER_ADMIN") || roles.includes("ADMIN") || roles.includes("QUESTION_REVIEWER")
          ? "/admin/dashboard"
          : "/candidate/dashboard";

      const targetPath = callbackUrl || defaultDashboard;
      const targetUrl = localizePath(targetPath, locale);

      window.location.href = targetUrl;
    } catch {
      setError(t("errors.networkError"));
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">{t("auth.signInTitle")}</CardTitle>
        <CardDescription>{t("auth.signInSubtitle")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              label={t("auth.email")}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                {t("auth.password")}
              </label>
              <Link href={localizePath("/forgot-password", locale)} className="text-xs text-blue-600 hover:underline">
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full font-semibold" size="lg" isLoading={isLoading}>
            {t("auth.signIn")}
          </Button>

          <p className="text-center text-sm text-slate-600">
            {t("auth.dontHaveAccount")}{" "}
            <Link href={localizePath("/register", locale)} className="font-semibold text-blue-600 hover:underline">
              {t("auth.createAccount")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
