"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VerifyForm } from "@/components/scanner/verify-form";
import { InvalidQR } from "@/components/scanner/invalid-qr";
import { validateQR } from "@/lib/api/scanner";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function ScanPage() {
  const params = useParams<{ shortCode: string }>();
  const shortCode = params?.shortCode ?? "";
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [maskedNumber, setMaskedNumber] = useState<string | undefined>();

  useEffect(() => {
    if (!shortCode) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    async function check() {
      try {
        const res = await validateQR(shortCode);
        if (cancelled) return;
        if (res.success && res.data?.valid) {
          setMaskedNumber(res.data.maskedNumber);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    }
    check();
    return () => { cancelled = true; };
  }, [shortCode]);

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
            <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Verifying QR code...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen py-8">
        <InvalidQR />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <VerifyForm shortCode={shortCode} maskedNumber={maskedNumber} />
    </div>
  );
}
