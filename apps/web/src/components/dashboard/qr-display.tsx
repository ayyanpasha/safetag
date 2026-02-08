"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Share2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QrDisplayProps {
  qrCode: string;
  qrShortCode: string;
  vehicleNumber: string;
}

export function QrDisplay({ qrCode, qrShortCode, vehicleNumber }: QrDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `safetag-${vehicleNumber}.png`;
    link.click();
    setTimeout(() => setDownloading(false), 1000);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(qrShortCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SafeTag QR - ${vehicleNumber}`,
          text: `Scan this QR code or use code: ${qrShortCode}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  }

  const hasValidQr = qrCode.startsWith("data:") || qrCode.startsWith("http");

  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      <div className="absolute -top-20 -right-20 h-40 w-40 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-40 w-40 bg-primary/5 rounded-full blur-3xl" />

      <CardHeader className="relative text-center pb-2">
        <div className="mx-auto mb-3 rounded-full bg-primary/10 p-3 w-fit">
          <QrCode className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          SafeTag QR Code
          <Sparkles className="h-4 w-4 text-primary/50" aria-hidden="true" />
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Print and attach to your vehicle
        </p>
      </CardHeader>

      <CardContent className="relative flex flex-col items-center gap-6 pt-4">
        {/* QR Code Display */}
        <div className="relative group">
          {/* Decorative border */}
          <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* QR Code container */}
          <div className="relative bg-white p-4 rounded-xl shadow-lg shadow-black/5">
            {hasValidQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCode}
                alt={`QR code for ${vehicleNumber}`}
                className="w-48 h-48 rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex flex-col items-center justify-center gap-2">
                <QrCode className="h-16 w-16 text-muted-foreground/50" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">QR not available</span>
              </div>
            )}
          </div>

          {/* Corner decorations */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
        </div>

        {/* Short Code */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border">
          <span className="text-sm text-muted-foreground">Code:</span>
          <span className="font-mono font-bold tracking-wider text-lg">{qrShortCode}</span>
          <button
            onClick={handleCopyCode}
            className={cn(
              "p-1.5 rounded-full transition-all duration-200",
              "hover:bg-primary/10 active:scale-95"
            )}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            onClick={handleDownload}
            className={cn(
              "flex-1 min-h-[48px] font-semibold transition-all duration-300",
              "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
              "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            )}
            disabled={!hasValidQr || downloading}
          >
            {downloading ? (
              <Check className="h-5 w-5 mr-2 animate-in zoom-in" aria-hidden="true" />
            ) : (
              <Download className="h-5 w-5 mr-2" aria-hidden="true" />
            )}
            {downloading ? "Downloaded!" : "Download QR"}
          </Button>

          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <Button
              variant="outline"
              onClick={handleShare}
              className="min-h-[48px] font-semibold"
            >
              <Share2 className="h-5 w-5 mr-2" aria-hidden="true" />
              Share
            </Button>
          )}
        </div>

        {/* Tip */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-muted w-full max-w-sm">
          <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pro tip:</span> Place the QR code on
            your dashboard or rear windshield for easy scanning.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
