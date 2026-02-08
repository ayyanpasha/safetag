"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useScannerStore } from "@/lib/stores/scanner-store";
import { initiateScan } from "@/lib/api/scanner";
import { ShieldCheck, Car, Loader2 } from "lucide-react";

interface VerifyFormProps {
  shortCode: string;
  maskedNumber?: string;
}

export function VerifyForm({ shortCode, maskedNumber }: VerifyFormProps) {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setSession = useScannerStore((s) => s.setSession);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const formatted = vehicleNumber.toUpperCase().replace(/\s/g, "");
    if (formatted.length < 4) {
      setError("Please enter a valid vehicle number");
      return;
    }

    setLoading(true);
    try {
      let location = { latitude: 0, longitude: 0 };
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch {
        // Location not available, proceed without
      }

      const fingerprint = navigator.userAgent;
      const res = await initiateScan({ shortCode, vehicleNumber: formatted, location, fingerprint });

      if (res.success && res.data) {
        setSession({ ...res.data, shortCode });
        router.push(`/s/${shortCode}/action`);
      } else {
        setError(res.error ?? "Vehicle not found. Please check the number.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 py-10 text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 mb-5">
            <ShieldCheck className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">Verify Vehicle</h1>
          <p className="text-primary-foreground/80 mt-3 max-w-xs mx-auto">
            {maskedNumber
              ? `Confirm the vehicle number (${maskedNumber}) to contact the owner`
              : "Enter the vehicle number to verify and contact the owner"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber" className="text-sm font-medium">
                Vehicle Number
              </Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Car className="h-5 w-5" />
                </div>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g. KA01AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? "vehicle-error" : undefined}
                  disabled={loading}
                  autoFocus
                  className="h-14 text-lg pl-12 rounded-xl font-mono tracking-wider"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p id="vehicle-error" className="text-sm text-red-600 text-center" role="alert">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <p>
                This verification ensures you&apos;re contacting the right vehicle owner.
                Your privacy is protected.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Powered by SafeTag - Anonymous vehicle contact
      </p>
    </div>
  );
}
