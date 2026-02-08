"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Car, AlertTriangle, ShieldCheck, CreditCard, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatsCardsProps {
  vehicleCount: number;
  activeIncidents: number;
  resolvedIncidents: number;
  subscriptionStatus: string | null;
}

const statsConfig = [
  {
    key: "vehicles",
    title: "Total Vehicles",
    icon: Car,
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    borderColor: "border-blue-500/20",
    accentColor: "bg-blue-500",
  },
  {
    key: "active",
    title: "Active Incidents",
    icon: AlertTriangle,
    gradient: "from-red-500/10 via-red-500/5 to-transparent",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600",
    borderColor: "border-red-500/20",
    accentColor: "bg-red-500",
  },
  {
    key: "resolved",
    title: "Resolved",
    icon: ShieldCheck,
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-500/20",
    accentColor: "bg-emerald-500",
  },
  {
    key: "subscription",
    title: "Subscription",
    icon: CreditCard,
    gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    borderColor: "border-violet-500/20",
    accentColor: "bg-violet-500",
  },
];

export function StatsCards({ vehicleCount, activeIncidents, resolvedIncidents, subscriptionStatus }: StatsCardsProps) {
  const values: Record<string, number | string> = {
    vehicles: vehicleCount,
    active: activeIncidents,
    resolved: resolvedIncidents,
    subscription: subscriptionStatus ?? "None",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => (
        <Card
          key={stat.key}
          className={cn(
            "relative overflow-hidden border transition-all duration-300",
            "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5",
            "dark:hover:shadow-black/20",
            stat.borderColor
          )}
        >
          {/* Gradient background */}
          <div className={cn("absolute inset-0 bg-gradient-to-br", stat.gradient)} />

          {/* Accent line at top */}
          <div className={cn("absolute top-0 left-0 right-0 h-1", stat.accentColor)} />

          <CardContent className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{values[stat.key]}</span>
                  {stat.key === "resolved" && resolvedIncidents > 0 && (
                    <span className="flex items-center text-xs text-emerald-600 font-medium">
                      <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
                      100%
                    </span>
                  )}
                </div>
              </div>
              <div className={cn("rounded-xl p-3", stat.iconBg)}>
                <stat.icon className={cn("h-6 w-6", stat.iconColor)} aria-hidden="true" />
              </div>
            </div>

            {/* Decorative sparkle for subscription */}
            {stat.key === "subscription" && subscriptionStatus === "ACTIVE" && (
              <Sparkles className="absolute bottom-3 right-3 h-4 w-4 text-violet-400/50" aria-hidden="true" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
