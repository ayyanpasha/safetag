"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/otp-input";
import { api } from "@/lib/api/client";
import { useScannerStore } from "@/lib/stores/scanner-store";
import { Phone, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import { VoipCall } from "@/components/scanner/voip-call";

type Step = "phone" | "otp" | "verified" | "calling";

export function CallInterface() {
  const params = useParams();
  const router = useRouter();
  const shortCode = params?.shortCode as string;
  const sessionToken = useScannerStore((s) => s.sessionToken);

  useEffect(() => {
    if (!sessionToken) {
      router.replace(`/s/${shortCode}`);
    }
  }, [sessionToken, shortCode, router]);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [callId, setCallId] = useState("");

  async function handleSendOtp() {
    if (!phone) return;
    setLoading(true);
    setError("");
    const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;
    try {
      const res = await api.post<{ message: string; otp?: string }>("/api/auth/otp/send", { phone: formatted });
      if (res.success) {
        setPhone(formatted);
        if (res.data?.otp) setDevOtp(res.data.otp);
        setStep("otp");
      } else {
        setError(res.error ?? "Failed to send OTP");
      }
    } catch {
      setError("Failed to send OTP");
    }
    setLoading(false);
  }

  async function handleVerifyOtp(otp: string) {
    setLoading(true);
    setError("");
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>("/api/auth/otp/verify", { phone, otp });
      if (!res.success) {
        setError("Invalid OTP");
        setLoading(false);
        return;
      }
      setStep("verified");
    } catch {
      setError("Verification failed");
    }
    setLoading(false);
  }

  async function handleStartCall() {
    setLoading(true);
    setError("");
    try {
      const callRes = await api.post<{ callId: string }>("/api/contact/voip/create-call", {
        shortCode,
        callerPhone: phone,
      });
      if (callRes.success && callRes.data) {
        setCallId(callRes.data.callId);
        setStep("calling");
      } else {
        setError("Failed to start call. Please try again.");
      }
    } catch {
      setError("Failed to start call.");
    }
    setLoading(false);
  }

  if (step === "calling" && callId) {
    return <VoipCall callId={callId} role="caller" onEnded={() => setStep("phone")} />;
  }

  if (step === "otp") {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <button
          onClick={() => setStep("phone")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <Shield className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold">Verify Your Number</h1>
            <p className="text-sm text-white/80 mt-2">
              Enter the 6-digit code sent to
            </p>
            <p className="font-mono font-medium mt-1">{phone}</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {devOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <span className="text-xs text-amber-600 font-medium">Dev Mode OTP:</span>
                <span className="ml-2 font-mono font-bold text-amber-700">{devOtp}</span>
              </div>
            )}

            <OtpInput onComplete={handleVerifyOtp} disabled={loading} error={!!error} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-sm text-red-600" role="alert">{error}</p>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t receive the code?{" "}
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "verified") {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold">Phone Verified</h1>
            <p className="text-sm text-white/80 mt-2">
              Your number has been verified
            </p>
            <p className="font-mono font-medium mt-1">{phone}</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Privacy Protected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your phone number will not be shared with the vehicle owner. The call is routed through our secure system.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-sm text-red-600" role="alert">{error}</p>
              </div>
            )}

            <Button
              className="w-full h-14 text-base rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
              disabled={loading}
              onClick={handleStartCall}
            >
              <Phone className="h-5 w-5 mr-2" />
              {loading ? "Connecting..." : "Call Vehicle Owner"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <Phone className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold">Call Vehicle Owner</h1>
          <p className="text-sm text-white/80 mt-2">
            Verify your number to make an anonymous call
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="caller-phone" className="text-sm font-medium">
                Your Phone Number
              </Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-4 rounded-xl bg-muted border text-sm font-medium">
                  +91
                </div>
                <Input
                  id="caller-phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone.replace("+91", "")}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "phone-error" : undefined}
                  disabled={loading}
                  className="h-12 text-base rounded-xl"
                />
              </div>
              {error && (
                <p id="phone-error" className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  We need your number for verification only. It will never be shared with the vehicle owner.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base rounded-xl"
              disabled={loading || phone.length < 10}
            >
              {loading ? "Sending OTP..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
