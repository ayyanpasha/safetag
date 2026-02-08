"use client";

import Link from "next/link";
import { useVehicles } from "@/lib/hooks/use-vehicles";
import { VehicleCard } from "@/components/dashboard/vehicle-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import {
  Car,
  Plus,
  Search,
  Shield,
  Sparkles,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export default function VehiclesPage() {
  const { vehicles, loading } = useVehicles();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  if (loading) return <LoadingSkeleton />;

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && vehicle.isActive) ||
      (filter === "inactive" && !vehicle.isActive);

    return matchesSearch && matchesFilter;
  });

  const activeCount = vehicles.filter((v) => v.isActive).length;
  const inactiveCount = vehicles.length - activeCount;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 h-32 w-32 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Car className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
                  <p className="text-muted-foreground">
                    {vehicles.length === 0
                      ? "Add your first vehicle to get started"
                      : `Managing ${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all"
            >
              <Link href="/dashboard/vehicles/new" className="flex items-center gap-2">
                <Plus className="h-5 w-5" aria-hidden="true" />
                Add Vehicle
              </Link>
            </Button>
          </div>

          {/* Stats Bar */}
          {vehicles.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">{activeCount} Active</span>
              </div>
              {inactiveCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-sm font-medium">{inactiveCount} Inactive</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {vehicles.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16">
            <EmptyState
              icon={Car}
              title="No vehicles yet"
              description="Add your first vehicle to get started with SafeTag protection. Each vehicle gets a unique QR code for easy identification."
              action={
                <Button asChild size="lg" className="shadow-lg shadow-primary/20 mt-4">
                  <Link href="/dashboard/vehicles/new" className="flex items-center gap-2">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    Add Your First Vehicle
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search by number, make, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-3 rounded-xl border bg-background",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border bg-muted/30 p-1">
                {(["all", "active", "inactive"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                      filter === f
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center rounded-lg border bg-muted/30 p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="List view"
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Vehicles List/Grid */}
          {filteredVehicles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <EmptyState
                  icon={Search}
                  title="No vehicles found"
                  description={`No vehicles match your search "${searchQuery}". Try a different search term.`}
                  action={
                    <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
                      Clear Search
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  : "space-y-3"
              )}
            >
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}

          {/* Info Footer */}
          <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-full bg-primary/10 p-2 shrink-0">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Quick Tip</h3>
                <p className="text-sm text-muted-foreground">
                  Click on any vehicle to view its details, download the QR code, or manage its
                  settings. Each vehicle has a unique SafeTag QR code that you can print and attach
                  to your vehicle.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
