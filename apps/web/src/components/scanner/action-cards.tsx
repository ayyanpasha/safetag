"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Phone, AlertTriangle, ChevronRight, Car } from "lucide-react";
import { useScannerStore } from "@/lib/stores/scanner-store";

interface ActionCardsProps {
  shortCode: string;
}

const actions = [
  {
    key: "whatsapp",
    icon: MessageSquare,
    title: "WhatsApp Message",
    description: "Send a quick message about a parking issue",
    href: "whatsapp",
    gradient: "from-green-500 to-emerald-600",
    iconBg: "bg-white/20",
    shadow: "shadow-green-500/25",
  },
  {
    key: "call",
    icon: Phone,
    title: "Call Owner",
    description: "Anonymous VoIP call - your number stays private",
    href: "call",
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-white/20",
    shadow: "shadow-blue-500/25",
  },
  {
    key: "emergency",
    icon: AlertTriangle,
    title: "Report Emergency",
    description: "Accident, theft, or other urgent situations",
    href: "emergency",
    gradient: "from-red-500 to-rose-600",
    iconBg: "bg-white/20",
    shadow: "shadow-red-500/25",
  },
] as const;

export function ActionCards({ shortCode }: ActionCardsProps) {
  const router = useRouter();
  const sessionToken = useScannerStore((s) => s.sessionToken);
  const vehicleNumber = useScannerStore((s) => s.vehicleNumber);

  useEffect(() => {
    if (!sessionToken) {
      router.replace(`/s/${shortCode}`);
    }
  }, [sessionToken, shortCode, router]);

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
          <Car className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Contact Vehicle Owner</h1>
        {vehicleNumber && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border">
            <span className="text-sm font-medium text-muted-foreground">Vehicle:</span>
            <span className="text-sm font-bold tracking-wider">{vehicleNumber}</span>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        {actions.map((action) => (
          <Link key={action.key} href={`/s/${shortCode}/${action.href}`} className="block">
            <div
              className={`
                relative overflow-hidden rounded-2xl bg-gradient-to-r ${action.gradient}
                p-5 text-white shadow-lg ${action.shadow}
                transform transition-all duration-200
                hover:scale-[1.02] hover:shadow-xl
                active:scale-[0.98]
                min-h-[100px]
              `}
            >
              {/* Background decoration */}
              <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute right-0 bottom-0 -mr-4 -mb-4 h-20 w-20 rounded-full bg-white/5" />

              <div className="relative flex items-center gap-4">
                <div className={`flex-shrink-0 rounded-xl ${action.iconBg} p-3.5`}>
                  <action.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold">{action.title}</h2>
                  <p className="text-sm text-white/80 mt-0.5">{action.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 flex-shrink-0" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        Your contact information is protected by SafeTag
      </p>
    </div>
  );
}
