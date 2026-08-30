"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Mail, ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
import { getLocaleFromPath, localizePath, getTranslations } from "@/lib/i18n";
import { useLoading } from "@/components/common/loading-overlay";

export function RegisterForm() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPath(pathname);
  const isHindi = locale === "hi";
  const { t } = getTranslations(locale);
  const { withLoading } = useLoading();

  // Multi-step State: "REGISTER" | "VERIFY_OTP"
  const [step, setStep] = useState<"REGISTER" | "VERIFY_OTP">("REGISTER");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend Timer countdown effect
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

  // 1. Submit Registration Details & Request OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(isHindi ? "पासवर्ड मेल नहीं खाते हैं" : "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError(isHindi ? "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए" : "Password must be at least 8 characters");
      return;
    }

    await withLoading(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            confirmPassword,
            phoneNumber: phoneNumber || undefined,
            locale,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error?.message || (isHindi ? "पंजीकरण विफल रहा" : "Registration failed"));
          return;
        }

        setSuccessMessage(data.data?.message || (isHindi ? "सत्यापन कोड आपके ईमेल पर भेजा गया है" : "Verification code sent to your email"));
        setResendCooldown(data.data?.resendCooldownSeconds || 60);
        setStep("VERIFY_OTP");
      } catch {
        setError(t("errors.networkError"));
      }
    }, isHindi ? "सत्यापन कोड भेजा जा रहा है..." : "Sending verification code...");
  };

  // 2. Verify Email OTP and Activate Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError(isHindi ? "कृपया 6-अंकीय ओटीपी दर्ज करें" : "Please enter the 6-digit OTP code");
      return;
    }

    await withLoading(async () => {
      try {
        const res = await fetch("/api/auth/register/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error?.message || (isHindi ? "अमान्य या समाप्त सत्यापन कोड" : "Invalid or expired verification code"));
          return;
        }

        // Redirect to profile setup or candidate dashboard
        router.replace(localizePath("/candidate/profile", locale));
      } catch {
        setError(t("errors.networkError"));
      }
    }, isHindi ? "ईमेल सत्यापित किया जा रहा है..." : "Verifying email address...");
  };

  // 3. Resend OTP with Cooldown Protection
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);

    await withLoading(async () => {
      try {
        const res = await fetch("/api/auth/register/resend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, locale }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error?.message || (isHindi ? "ओटीपी पुनः भेजने में विफल" : "Failed to resend verification code"));
          return;
        }

        setSuccessMessage(isHindi ? "नया सत्यापन कोड भेज दिया गया है" : "Fresh verification code sent");
        setResendCooldown(data.data?.resendCooldownSeconds || 60);
      } catch {
        setError(t("errors.networkError"));
      }
    }, isHindi ? "नया कोड भेजा जा रहा है..." : "Resending verification code...");
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-1 text-center pb-4">
        {step === "REGISTER" ? (
          <>
            <CardTitle className="text-2xl font-bold tracking-tight">{t("auth.registerTitle")}</CardTitle>
            <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mx-auto mb-2">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              {isHindi ? "ईमेल सत्यापित करें" : "Verify Your Email"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isHindi ? "सत्यापन कोड भेजा गया है:" : "Verification code sent to:"}{" "}
              <span className="font-semibold text-slate-900 dark:text-white font-mono">{maskEmail(email)}</span>
            </CardDescription>
          </>
        )}
      </CardHeader>

      {step === "REGISTER" ? (
        <form onSubmit={handleRegisterSubmit}>
          <CardContent className="space-y-3.5">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="fullName"
              label={t("auth.fullName")}
              placeholder={t("auth.fullNamePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />

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

            <Input
              id="phoneNumber"
              type="tel"
              label={t("auth.phone")}
              placeholder={t("auth.phonePlaceholder")}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              autoComplete="tel"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="password"
                type="password"
                label={t("auth.password")}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Input
                id="confirmPassword"
                type="password"
                label={isHindi ? "पासवर्ड की पुष्टि करें" : "Confirm Password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full font-semibold min-h-[44px]" size="lg">
              <Mail className="h-4 w-4 mr-2" />
              {isHindi ? "खाता बनाएं एवं ओटीपी प्राप्त करें" : "Create Account & Get OTP"}
            </Button>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link href={localizePath("/login", locale)} className="font-semibold text-blue-600 hover:underline">
                {t("auth.signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && !error && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="otpInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {isHindi ? "6-अंकीय सत्यापन कोड (OTP)" : "6-Digit Verification Code"}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="otpInput"
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
              <p className="text-[11px] text-slate-500">
                {isHindi ? "कोड 10 मिनट के लिए वैध है।" : "Code expires in 10 minutes."}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button type="submit" disabled={otp.length !== 6} className="w-full font-semibold min-h-[44px]" size="lg">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isHindi ? "ईमेल सत्यापित करें" : "Verify Email & Activate"}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("REGISTER");
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
                onClick={handleResendOtp}
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
    </Card>
  );
}
