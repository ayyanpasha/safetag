"use client";

import { useVehicles } from "@/lib/hooks/use-vehicles";
import { useIncidents } from "@/lib/hooks/use-incidents";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncidentRow } from "@/components/dashboard/incident-row";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function DashboardHome() {
  const { vehicles, loading: vLoading } = useVehicles();
  const { incidents, loading: iLoading } = useIncidents();
  const { subscription, loading: sLoading } = useSubscription();

  const loading = vLoading || iLoading || sLoading;

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const activeIncidents = incidents.filter((i) => i.status === "OPEN");
  const resolvedIncidents = incidents.filter((i) => i.status === "RESOLVED");
  const hasActiveSubscription = subscription?.status === "ACTIVE";

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute -top-4 -left-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              {hasActiveSubscription && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-medium">
                  <Zap className="h-3 w-3" aria-hidden="true" />
                  Pro
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s an overview of your vehicles and incidents.
            </p>
          </div>

          {/* Quick action */}
          <Button asChild size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20">
            <Link href="/dashboard/vehicles/new" className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        vehicleCount={vehicles.length}
        activeIncidents={activeIncidents.length}
        resolvedIncidents={resolvedIncidents.length}
        subscriptionStatus={subscription?.status ?? null}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents - Takes 2 columns */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-lg">Recent Incidents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {activeIncidents.length > 0
                    ? `${activeIncidents.length} requiring attention`
                    : "All clear!"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
              <Link href="/dashboard/incidents" className="flex items-center gap-1">
                View all
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {incidents.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No incidents"
                description="No incidents reported for your vehicles yet. Your vehicles are safe!"
              />
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => (
                  <IncidentRow key={incident.id} incident={incident} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats / Tips - Takes 1 column */}
        <div className="space-y-6">
          {/* Activity Summary */}
          <Card className="overflow-hidden border-dashed">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
                <CardTitle className="text-base">Activity Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Protected Vehicles</span>
                <span className="font-bold text-lg">{vehicles.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Incidents</span>
                <span className="font-bold text-lg">{incidents.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                <span className="text-sm text-emerald-700">Resolution Rate</span>
                <span className="font-bold text-lg text-emerald-700">
                  {incidents.length > 0
                    ? Math.round((resolvedIncidents.length / incidents.length) * 100)
                    : 100}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tips Card */}
          <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Pro Tip</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Place your SafeTag QR code on both your dashboard and rear windshield for
                    maximum visibility. This helps others quickly contact you in case of parking
                    issues.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade CTA for non-subscribers */}
          {!hasActiveSubscription && (
            <Card className="overflow-hidden bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-violet-600" aria-hidden="true" />
                    <h3 className="font-semibold">Upgrade to Pro</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get unlimited vehicles, priority support, and advanced analytics.
                  </p>
                  <Button asChild size="sm" className="w-full mt-2">
                    <Link href="/dashboard/subscription">View Plans</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
