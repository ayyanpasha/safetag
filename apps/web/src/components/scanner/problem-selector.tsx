"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useScannerStore } from "@/lib/stores/scanner-store";
import { sendWhatsAppComplaint } from "@/lib/api/contact";
import type { ProblemType } from "@safetag/shared-types";
import {
  CheckCircle,
  ParkingCircle,
  Truck,
  Lightbulb,
  Ban,
  Bell,
  DoorOpen,
  CircleHelp,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

const problems: { value: ProblemType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "WRONG_PARKING", label: "Wrong Parking", icon: ParkingCircle, color: "from-red-500 to-rose-600" },
  { value: "GETTING_TOWED", label: "Getting Towed", icon: Truck, color: "from-orange-500 to-amber-600" },
  { value: "LIGHTS_ON", label: "Lights Left On", icon: Lightbulb, color: "from-yellow-500 to-amber-500" },
  { value: "BLOCKING_DRIVEWAY", label: "Blocking Driveway", icon: Ban, color: "from-purple-500 to-violet-600" },
  { value: "ALARM_GOING_OFF", label: "Alarm Going Off", icon: Bell, color: "from-pink-500 to-rose-600" },
  { value: "DOOR_OPEN", label: "Door Open", icon: DoorOpen, color: "from-blue-500 to-indigo-600" },
  { value: "OTHER", label: "Other Issue", icon: CircleHelp, color: "from-gray-500 to-slate-600" },
];

export function ProblemSelector() {
  const [selected, setSelected] = useState<ProblemType | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const sessionToken = useScannerStore((s) => s.sessionToken);
  const router = useRouter();

  async function handleSend() {
    if (!selected || !sessionToken) return;
    setLoading(true);
    setError("");
    const res = await sendWhatsAppComplaint({ sessionToken, problemType: selected });
    if (res.success) {
      setSent(true);
    } else {
      setError(res.error ?? "Failed to send. Please try again.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-12 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
              <CheckCircle className="h-10 w-10" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold">Message Sent!</h2>
            <p className="text-white/80 mt-3 max-w-xs mx-auto">
              The vehicle owner has been notified via WhatsApp.
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
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <MessageSquare className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold">Send WhatsApp Message</h1>
          <p className="text-sm text-white/80 mt-2">
            Select the issue to notify the vehicle owner
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {problems.map((p) => {
              const Icon = p.icon;
              const isSelected = selected === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setSelected(p.value)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all
                    min-h-[100px]
                    ${isSelected
                      ? `border-transparent bg-gradient-to-br ${p.color} text-white shadow-lg scale-[1.02]`
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    }
                  `}
                >
                  <Icon className={`h-7 w-7 mb-2 ${isSelected ? "" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium text-center ${isSelected ? "" : "text-foreground"}`}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={!selected || loading}
            className="w-full h-14 text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            {loading ? "Sending..." : "Send via WhatsApp"}
          </Button>
        </div>
      </div>
    </div>
  );
}
