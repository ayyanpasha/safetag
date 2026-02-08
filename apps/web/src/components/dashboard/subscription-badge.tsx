import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SubStatus } from "@safetag/shared-types";

const statusConfig: Record<
  string,
  {
    label: string;
    icon: typeof CheckCircle2;
    bgColor: string;
    textColor: string;
    borderColor: string;
    iconColor: string;
    pulse?: boolean;
  }
> = {
  ACTIVE: {
    label: "Active",
    icon: CheckCircle2,
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-700 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-600",
  },
  TRIALING: {
    label: "Trial",
    icon: Sparkles,
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-700 dark:text-violet-400",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-600",
    pulse: true,
  },
  PAST_DUE: {
    label: "Past Due",
    icon: AlertCircle,
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-600",
    pulse: true,
  },
  CANCELED: {
    label: "Canceled",
    icon: XCircle,
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-700 dark:text-gray-400",
    borderColor: "border-gray-500/30",
    iconColor: "text-gray-600",
  },
  EXPIRED: {
    label: "Expired",
    icon: Clock,
    bgColor: "bg-red-500/10",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-500/30",
    iconColor: "text-red-600",
  },
};

interface SubscriptionBadgeProps {
  status: SubStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function SubscriptionBadge({
  status,
  size = "md",
  showIcon = true,
}: SubscriptionBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status.replace(/_/g, " "),
    icon: Clock,
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-700 dark:text-gray-400",
    borderColor: "border-gray-500/30",
    iconColor: "text-gray-600",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center font-medium border transition-all duration-200",
        "hover:shadow-sm",
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size]
      )}
    >
      {showIcon && (
        <span className="relative">
          <Icon className={cn(iconSizes[size], config.iconColor)} aria-hidden="true" />
          {config.pulse && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                status === "TRIALING" ? "bg-violet-500" : "bg-amber-500"
              )}
            >
              <span
                className={cn(
                  "absolute inset-0 rounded-full animate-ping",
                  status === "TRIALING" ? "bg-violet-400" : "bg-amber-400"
                )}
              />
            </span>
          )}
        </span>
      )}
      {config.label}
      {status === "ACTIVE" && (
        <Zap className={cn(iconSizes[size], "text-emerald-500/50 ml-0.5")} aria-hidden="true" />
      )}
    </Badge>
  );
}

// Variant for displaying subscription status with more context
interface SubscriptionStatusCardProps {
  status: SubStatus;
  planName?: string;
  expiresAt?: string;
}

export function SubscriptionStatusCard({
  status,
  planName,
  expiresAt,
}: SubscriptionStatusCardProps) {
  const config = statusConfig[status] ?? statusConfig.CANCELED;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className={cn("rounded-full p-2", config.bgColor)}>
        <Icon className={cn("h-5 w-5", config.iconColor)} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", config.textColor)}>{config.label}</span>
          {planName && <span className="text-muted-foreground">- {planName}</span>}
        </div>
        {expiresAt && (
          <p className="text-sm text-muted-foreground">
            {status === "ACTIVE" ? "Renews" : "Expired"}: {expiresAt}
          </p>
        )}
      </div>
    </div>
  );
}
