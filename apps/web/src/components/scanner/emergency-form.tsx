"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/otp-input";
import { useScannerStore } from "@/lib/stores/scanner-store";
import { sendVoipOtp } from "@/lib/api/contact";
import { reportEmergency } from "@/lib/api/contact";
import type { EmergencyType } from "@safetag/shared-types";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Car,
  Flame,
  ShieldAlert,
  CircleAlert,
  X,
  ArrowLeft,
  ImageIcon,
} from "lucide-react";

const emergencyTypes: { value: EmergencyType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "ACCIDENT", label: "Accident", icon: CircleAlert, color: "from-orange-500 to-amber-600" },
  { value: "CAR_CRASH", label: "Car Crash", icon: Car, color: "from-red-500 to-rose-600" },
  { value: "THEFT", label: "Theft", icon: ShieldAlert, color: "from-purple-500 to-violet-600" },
  { value: "VANDALISM", label: "Vandalism", icon: AlertTriangle, color: "from-pink-500 to-rose-600" },
  { value: "FIRE", label: "Fire", icon: Flame, color: "from-red-600 to-orange-600" },
  { value: "OTHER", label: "Other", icon: CircleAlert, color: "from-gray-500 to-slate-600" },
];

type Step = "form" | "otp" | "success";

export function EmergencyForm() {
  const [step, setStep] = useState<Step>("form");
  const [emergencyType, setEmergencyType] = useState<EmergencyType | null>(null);
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sessionToken = useScannerStore((s) => s.sessionToken);
  const router = useRouter();

  function handlePhotoChange(file: File | null) {
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  async function handleNext() {
    if (!emergencyType || !phone || !sessionToken) return;
    setLoading(true);
    setError("");
    const formatted = phone.startsWith("+91") ? phone : `+91${phone}`;
    setPhone(formatted);
    const res = await sendVoipOtp(sessionToken, formatted);
    if (res.success) {
      setStep("otp");
    } else {
      setError(res.error ?? "Failed to send OTP");
    }
    setLoading(false);
  }

  async function handleOtpComplete(otp: string) {
    if (!sessionToken || !emergencyType) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("sessionToken", sessionToken);
    formData.append("phone", phone);
    formData.append("otp", otp);
    formData.append("emergencyType", emergencyType);
    if (photo) formData.append("photo", photo);

    const res = await reportEmergency(formData);
    if (res.success) {
      setStep("success");
    } else {
      setError(res.error ?? "Failed to report. Please try again.");
    }
    setLoading(false);
  }

  if (step === "success") {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-12 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
              <CheckCircle className="h-10 w-10" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold">Emergency Reported</h2>
            <p className="text-white/80 mt-3 max-w-xs mx-auto">
              The vehicle owner and relevant authorities have been notified immediately.
            </p>
          </div>
          <div className="p-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full h-12 rounded-xl"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <button
          onClick={() => setStep("form")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-semibold">Verify to Report</h1>
            <p className="text-sm text-white/80 mt-2">
              Enter the 6-digit code sent to {phone}
            </p>
          </div>
          <div className="p-6 space-y-6">
            <OtpInput onComplete={handleOtpComplete} disabled={loading} error={!!error} />
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-sm text-red-600" role="alert">{error}</p>
              </div>
            )}
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
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold">Report Emergency</h1>
          <p className="text-sm text-white/80 mt-2">
            Report an urgent situation involving this vehicle
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Emergency Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What type of emergency?</Label>
            <div className="grid grid-cols-2 gap-3">
              {emergencyTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = emergencyType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEmergencyType(t.value)}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all
                      min-h-[90px]
                      ${isSelected
                        ? `border-transparent bg-gradient-to-br ${t.color} text-white shadow-lg`
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      }
                    `}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${isSelected ? "" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${isSelected ? "" : "text-foreground"}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="emergency-phone" className="text-sm font-medium">
              Your Phone Number
            </Label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center px-4 rounded-xl bg-muted border text-sm font-medium">
                +91
              </div>
              <Input
                id="emergency-phone"
                type="tel"
                placeholder="9876543210"
                value={phone.replace("+91", "")}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                className="h-12 text-base rounded-xl"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Photo Evidence (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border bg-muted">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handlePhotoChange(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Take or upload photo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Helps authorities respond faster
                  </p>
                </div>
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
            </div>
          )}

          <Button
            onClick={handleNext}
            disabled={!emergencyType || phone.length < 10 || loading}
            className="w-full h-14 text-base rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/25"
          >
            {loading ? "Submitting..." : "Report Emergency"}
          </Button>
        </div>
      </div>
    </div>
  );
}
