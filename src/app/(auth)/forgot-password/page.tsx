"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle, ArrowLeft, Mail, KeyRound, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";
import { useLoading } from "@/components/common/loading-overlay";

export default function ForgotPasswordPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPath(pathname);
  const isHindi = locale === "hi";
  const { t } = getTranslations(locale);
  const { withLoading } = useLoading();

  // Multi-step: "EMAIL" | "OTP_NEW_PASSWORD" | "SUCCESS"
  const [step, setStep] = useState<"EMAIL" | "OTP_NEW_PASSWORD" | "SUCCESS">("EMAIL");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer effect for cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const maskEmail = (rawEmail: string) => {
    return rawEmail.replace(/^(.)(.*)(@.*)$/, (_, a, _b, c) => `${a}***${c}`);
  };

  // 1. Request Password Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    await withLoading(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, locale }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error?.message || (isHindi ? "अनुरोध विफल रहा" : "Request failed"));
          return;
        }

        setResendCooldown(data.data?.resendCooldownSeconds || 60);
        setStep("OTP_NEW_PASSWORD");
      } catch {
        setError(t("errors.networkError"));
      }
    }, isHindi ? "सत्यापन कोड भेजा जा रहा है..." : "Sending reset code...");
  };

  // 2. Submit OTP and New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError(isHindi ? "कृपया 6-अंकीय ओटीपी दर्ज करें" : "Please enter the 6-digit OTP code");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isHindi ? "पासवर्ड मेल नहीं खाते हैं" : "Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError(isHindi ? "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए" : "Password must be at least 8 characters");
      return;
    }

    await withLoading(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp,
            newPassword,
            confirmPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error?.message || (isHindi ? "पासवर्ड रीसेट विफल रहा" : "Password reset failed"));
          return;
        }

        setStep("SUCCESS");
      } catch {
        setError(t("errors.networkError"));
      }
    }, isHindi ? "पासवर्ड अपडेट किया जा रहा है..." : "Updating password...");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 relative">
      {/* Top Locale Switcher Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <Link href={localizePath("/", locale)} className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <span>{t("common.appName")}</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-1 text-center pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "SUCCESS"
              ? isHindi
                ? "पासवर्ड सफलतापूर्वक बदला गया!"
                : "Password Updated Successfully!"
              : t("auth.resetPasswordTitle")}
          </CardTitle>
          <CardDescription className="text-xs">
            {step === "EMAIL" && t("auth.resetPasswordSubtitle")}
            {step === "OTP_NEW_PASSWORD" && (
              <>
                {isHindi ? "सत्यापन कोड भेजा गया है:" : "Verification code sent to:"}{" "}
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{maskEmail(email)}</span>
              </>
            )}
            {step === "SUCCESS" &&
              (isHindi
                ? "आप अब अपने नए पासवर्ड के साथ लॉगिन कर सकते हैं।"
                : "You can now sign in using your new credentials.")}
          </CardDescription>
        </CardHeader>

        {step === "EMAIL" && (
          <form onSubmit={handleRequestOtp}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                id="email"
                type="email"
                label={t("auth.email")}
                placeholder="candidate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full font-semibold min-h-[44px]" size="lg">
                <Mail className="h-4 w-4 mr-2" />
                {isHindi ? "सत्यापन कोड भेजें" : "Send Reset Code"}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "OTP_NEW_PASSWORD" && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-3.5">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {isHindi ? "6-अंकीय सत्यापन कोड (OTP)" : "6-Digit Reset Code"}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-center tracking-[8px] font-mono text-xl font-bold bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Input
                id="newPassword"
                type="password"
                label={isHindi ? "नया पासवर्ड" : "New Password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Input
                id="confirmPassword"
                type="password"
                label={isHindi ? "नए पासवर्ड की पुष्टि करें" : "Confirm New Password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" disabled={otp.length !== 6} className="w-full font-semibold min-h-[44px]" size="lg">
                <Lock className="h-4 w-4 mr-2" />
                {isHindi ? "पासवर्ड रीसेट करें" : "Reset Password"}
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setOtp("");
                    setError(null);
                  }}
                  className="inline-flex items-center text-slate-600 hover:text-blue-600 font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  {isHindi ? "ईमेल बदलें" : "Change Email"}
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleRequestOtp}
                  className={`inline-flex items-center font-medium ${
                    resendCooldown > 0 ? "text-slate-400 cursor-not-allowed" : "text-blue-600 hover:underline"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  {resendCooldown > 0
                    ? isHindi
                      ? `${resendCooldown}s में पुनः भेजें`
                      : `Resend in ${resendCooldown}s`
                    : isHindi
                    ? "ओटीपी पुनः भेजें"
                    : "Resend Code"}
                </button>
              </div>
            </CardFooter>
          </form>
        )}

        {step === "SUCCESS" && (
          <CardContent className="space-y-5 text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
              <CheckCircle className="h-9 w-9" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
              {isHindi
                ? "आपका पासवर्ड सफलतापूर्वक अपडेट कर दिया गया है।"
                : "Your password has been reset. Please sign in with your new credentials."}
            </p>
            <Button
              onClick={() => router.push(localizePath("/login", locale))}
              className="w-full font-semibold min-h-[44px]"
              size="lg"
            >
              {t("auth.signIn")}
            </Button>
          </CardContent>
        )}

        {step !== "SUCCESS" && (
          <div className="pb-6 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
            <Link
              href={localizePath("/login", locale)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.backToSignIn")}
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
