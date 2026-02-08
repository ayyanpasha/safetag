"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "@/components/auth/otp-input";
import { useAuthStore } from "@/lib/stores/auth-store";
import { sendOtp, verifyOtp } from "@/lib/api/auth";
import { ShieldCheck, Smartphone, ArrowLeft, Sparkles, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Step = "phone" | "otp";

const features = [
  "Privacy-first communication",
  "Instant notifications",
  "Free to start",
];

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const formatted = `+91${phone}`;
    if (!/^\+91[6-9]\d{9}$/.test(formatted)) {
      setError("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    const res = await sendOtp(formatted);
    if (res.success) {
      setStep("otp");
    } else {
      setError(res.error ?? "Failed to send OTP");
    }
    setLoading(false);
  }

  async function handleVerify(otp: string) {
    setLoading(true);
    setError("");
    const formatted = `+91${phone}`;
    const res = await verifyOtp(formatted, otp);
    if (res.success && res.data) {
      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      router.push("/dashboard");
    } else {
      setError(res.error ?? "Invalid OTP. Please try again.");
    }
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-teal-500/5" />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8881_1px,transparent_1px),linear-gradient(to_bottom,#8881_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] w-fit"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal-500 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative rounded-lg bg-gradient-to-br from-primary to-teal-500 p-2">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight">SafeTag</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to the future of{" "}
            <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
              vehicle communication
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Connect safely and instantly with anyone around your vehicle. No phone number exchange needed.
          </p>

          <ul className="mt-8 space-y-4">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal-500">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Trusted by thousands of vehicle owners across India
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link
            href="/"
            className="lg:hidden group flex items-center justify-center gap-2.5 mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal-500 rounded-lg blur-sm opacity-50" />
              <div className="relative rounded-lg bg-gradient-to-br from-primary to-teal-500 p-2">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight">SafeTag</span>
          </Link>

          <Card className="relative overflow-hidden border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl shadow-primary/5">
            {/* Card gradient border effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 via-transparent to-teal-500/20 opacity-50" />
            <div className="absolute inset-[1px] rounded-lg bg-background/95" />

            <CardHeader className="relative text-center pb-4">
              {/* Icon */}
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal-500 rounded-2xl blur-lg opacity-40" />
                <div className="relative rounded-2xl bg-gradient-to-br from-primary to-teal-500 p-4">
                  {step === "phone" ? (
                    <Smartphone className="h-8 w-8 text-white" />
                  ) : (
                    <Lock className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>

              <CardTitle className="text-2xl font-bold tracking-tight">
                {step === "phone" ? "Welcome back" : "Verify your number"}
              </CardTitle>
              <CardDescription className="text-base">
                {step === "phone"
                  ? "Enter your phone number to get started"
                  : (
                    <span className="flex items-center justify-center gap-2">
                      Enter the OTP sent to{" "}
                      <span className="font-mono font-semibold text-foreground">+91 {phone}</span>
                    </span>
                  )}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative">
              {step === "phone" ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center px-4 rounded-xl border-2 border-border bg-muted/50 text-sm font-semibold text-muted-foreground">
                        +91
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        maxLength={10}
                        aria-invalid={!!error || undefined}
                        aria-describedby={error ? "phone-error" : undefined}
                        disabled={loading}
                        autoFocus
                        className={cn(
                          "h-12 rounded-xl border-2 text-base font-medium",
                          "transition-all duration-200",
                          "focus:border-primary focus:ring-0",
                          error ? "border-destructive" : "border-border hover:border-primary/50"
                        )}
                      />
                    </div>
                    {error && (
                      <p id="phone-error" className="text-sm text-destructive flex items-center gap-2" role="alert">
                        <span className="h-1 w-1 rounded-full bg-destructive" />
                        {error}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className={cn(
                      "w-full h-12 rounded-xl text-base font-semibold",
                      "bg-gradient-to-r from-primary to-teal-500",
                      "hover:from-primary/90 hover:to-teal-500/90",
                      "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                      "transition-all duration-300 hover:scale-[1.02]",
                      "disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                    )}
                    disabled={loading || phone.length < 10}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending OTP...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Send OTP
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <OtpInput onComplete={handleVerify} disabled={loading} error={!!error} />

                  {error && (
                    <p className="text-sm text-destructive text-center flex items-center justify-center gap-2" role="alert">
                      <span className="h-1 w-1 rounded-full bg-destructive" />
                      {error}
                    </p>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Verifying...
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full h-11 rounded-xl hover:bg-accent/50 transition-all"
                      onClick={() => {
                        setStep("phone");
                        setError("");
                      }}
                      disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Change Phone Number
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Didn&apos;t receive the code?{" "}
                      <button
                        type="button"
                        className="text-primary font-medium hover:underline focus:outline-none disabled:opacity-50"
                        onClick={handleSendOtp}
                        disabled={loading}
                      >
                        Resend OTP
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-foreground hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-foreground hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
