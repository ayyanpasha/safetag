import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, QrCode, ChevronRight, Shield, Fuel } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Vehicle } from "@safetag/shared-types";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const isActive = vehicle.isActive;

  return (
    <Link href={`/dashboard/vehicles/${vehicle.id}`}>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5",
          "dark:hover:shadow-black/20",
          "border-l-4",
          isActive ? "border-l-emerald-500" : "border-l-gray-300"
        )}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="relative flex items-center gap-4 p-5">
          {/* Vehicle Icon with background */}
          <div
            className={cn(
              "relative rounded-2xl p-4 transition-transform duration-300 group-hover:scale-105",
              isActive
                ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"
                : "bg-gradient-to-br from-gray-500/10 to-gray-500/5"
            )}
          >
            <Car
              className={cn(
                "h-7 w-7 transition-colors",
                isActive ? "text-emerald-600" : "text-gray-500"
              )}
              aria-hidden="true"
            />
            {/* Status indicator dot */}
            <span
              className={cn(
                "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900",
                isActive ? "bg-emerald-500" : "bg-gray-400"
              )}
            />
          </div>

          {/* Vehicle Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg tracking-tight truncate">
                {vehicle.vehicleNumber}
              </h3>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={cn(
                  "text-xs font-medium",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20"
                    : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-500/20"
                )}
              >
                <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
                {isActive ? "Protected" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {vehicle.make && (
                <span className="flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5" aria-hidden="true" />
                  {vehicle.make}
                </span>
              )}
              {vehicle.model && <span>{vehicle.model}</span>}
              {vehicle.color && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full border border-gray-200 dark:border-gray-700"
                    style={{ backgroundColor: vehicle.color.toLowerCase() }}
                    aria-hidden="true"
                  />
                  {vehicle.color}
                </span>
              )}
              {!vehicle.make && !vehicle.model && !vehicle.color && (
                <span className="italic">No details added</span>
              )}
            </div>
          </div>

          {/* QR Code indicator and arrow */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-medium">QR Ready</span>
            </div>
            <ChevronRight
              className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
