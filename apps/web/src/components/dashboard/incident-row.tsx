import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/format";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Siren,
  Car,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Incident } from "@/lib/api/incidents";

const statusConfig = {
  OPEN: {
    label: "Open",
    variant: "destructive" as const,
    icon: Siren,
    bgColor: "bg-red-500/10",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-500/30",
    dotColor: "bg-red-500",
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    variant: "default" as const,
    icon: Clock,
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  RESOLVED: {
    label: "Resolved",
    variant: "secondary" as const,
    icon: CheckCircle2,
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-700 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
};

const emergencyIcons: Record<string, typeof AlertTriangle> = {
  PARKING_ISSUE: Car,
  EMERGENCY: ShieldAlert,
  CONTACT_REQUEST: Phone,
};

interface IncidentRowProps {
  incident: Incident;
}

export function IncidentRow({ incident }: IncidentRowProps) {
  const status = statusConfig[incident.status as keyof typeof statusConfig] ?? statusConfig.OPEN;
  const EmergencyIcon = emergencyIcons[incident.emergencyType] ?? AlertTriangle;
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/dashboard/incidents/${incident.id}`}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
        "hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5",
        "dark:hover:shadow-black/20",
        "bg-card",
        status.borderColor
      )}
    >
      {/* Status indicator line */}
      <div className={cn("w-1 h-12 rounded-full", status.dotColor)} />

      {/* Emergency type icon */}
      <div
        className={cn(
          "rounded-xl p-3 transition-transform duration-300 group-hover:scale-105",
          status.bgColor
        )}
      >
        <EmergencyIcon className={cn("h-5 w-5", status.textColor)} aria-hidden="true" />
      </div>

      {/* Incident details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base truncate">
            {incident.emergencyType.replace(/_/g, " ")}
          </h3>
          {/* Pulsing dot for open incidents */}
          {incident.status === "OPEN" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formatDateTime(incident.createdAt)}</span>
        </div>
      </div>

      {/* Status badge */}
      <Badge
        variant={status.variant}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 font-medium",
          status.bgColor,
          status.textColor,
          "border",
          status.borderColor
        )}
      >
        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {status.label}
      </Badge>

      {/* Arrow indicator */}
      <ChevronRight
        className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}
