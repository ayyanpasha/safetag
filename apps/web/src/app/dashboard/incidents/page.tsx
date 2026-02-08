"use client";

import { useState } from "react";
import { useIncidents } from "@/lib/hooks/use-incidents";
import { IncidentRow } from "@/components/dashboard/incident-row";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Siren,
  TrendingDown,
  Shield,
  Sparkles,
} from "lucide-react";

const filters = [
  { label: "All", value: undefined, icon: Filter, color: "text-primary" },
  { label: "Open", value: "OPEN", icon: Siren, color: "text-red-600" },
  { label: "Acknowledged", value: "ACKNOWLEDGED", icon: Clock, color: "text-amber-600" },
  { label: "Resolved", value: "RESOLVED", icon: CheckCircle2, color: "text-emerald-600" },
] as const;

export default function IncidentsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { incidents, loading } = useIncidents(filter);

  if (loading) return <LoadingSkeleton />;

  // Calculate stats
  const allIncidents = useIncidents(undefined);
  const openCount = allIncidents.incidents.filter((i) => i.status === "OPEN").length;
  const acknowledgedCount = allIncidents.incidents.filter((i) => i.status === "ACKNOWLEDGED").length;
  const resolvedCount = allIncidents.incidents.filter((i) => i.status === "RESOLVED").length;
  const totalCount = allIncidents.incidents.length;

  const stats = [
    {
      label: "Open",
      value: openCount,
      icon: Siren,
      bgColor: "bg-red-500/10",
      textColor: "text-red-700",
      borderColor: "border-red-500/20",
    },
    {
      label: "In Progress",
      value: acknowledgedCount,
      icon: Clock,
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-700",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: CheckCircle2,
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute -top-4 -left-4 h-24 w-24 bg-red-500/5 rounded-full blur-2xl" />
        <div className="absolute -top-4 right-1/4 h-16 w-16 bg-amber-500/5 rounded-full blur-xl" />

        <div className="relative space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Bell className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
              <p className="text-muted-foreground">
                {totalCount === 0
                  ? "No incidents reported yet"
                  : `${openCount > 0 ? `${openCount} requiring attention` : "All incidents handled"}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {totalCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className={cn(
                "overflow-hidden transition-all duration-300 hover:shadow-md",
                stat.borderColor,
                "border-l-4"
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn("rounded-xl p-3", stat.bgColor)}>
                  <stat.icon className={cn("h-5 w-5", stat.textColor)} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap p-1 bg-muted/30 rounded-xl w-fit border">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = filter === f.value;
          return (
            <Button
              key={f.label}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(f.value)}
              className={cn(
                "min-h-[40px] px-4 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-background shadow-sm text-foreground hover:bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              )}
            >
              <Icon
                className={cn("h-4 w-4 mr-2", isActive && f.color)}
                aria-hidden="true"
              />
              {f.label}
              {f.value === "OPEN" && openCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {openCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16">
            <EmptyState
              icon={filter ? AlertTriangle : Shield}
              title={filter ? `No ${filter.toLowerCase()} incidents` : "No incidents"}
              description={
                filter
                  ? `There are no ${filter.toLowerCase().replace("_", " ")} incidents at the moment.`
                  : "Great news! No incidents have been reported for your vehicles yet. Your vehicles are safe and protected."
              }
              action={
                filter && (
                  <Button variant="outline" onClick={() => setFilter(undefined)} className="mt-4">
                    View All Incidents
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))}
        </div>
      )}

      {/* Resolution Rate Card */}
      {totalCount > 0 && resolvedCount > 0 && (
        <Card className="bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 border-emerald-500/10">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-500/10 p-3">
                <TrendingDown className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold">Resolution Rate</h3>
                <p className="text-sm text-muted-foreground">
                  You&apos;ve successfully resolved {resolvedCount} out of {totalCount} incidents
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-emerald-600">
                {Math.round((resolvedCount / totalCount) * 100)}%
              </span>
              <p className="text-xs text-muted-foreground">completion rate</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state with tip */}
      {totalCount === 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">How incidents work</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When someone scans your vehicle&apos;s QR code and reports an issue (like a parking
                problem or emergency), you&apos;ll be notified immediately via WhatsApp. You can then
                acknowledge and resolve the incident right from this dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
