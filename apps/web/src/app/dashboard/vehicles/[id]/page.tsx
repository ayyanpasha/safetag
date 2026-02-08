"use client";

import { use } from "react";
import { useVehicle } from "@/lib/hooks/use-vehicles";
import { QrDisplay } from "@/components/dashboard/qr-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { Car } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function VehicleDetailPage({ params }: Props) {
  const { id } = use(params);
  const { vehicle, loading } = useVehicle(id);

  if (loading) return <LoadingSkeleton />;
  if (!vehicle) return <p className="text-center py-12 text-muted-foreground">Vehicle not found.</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{vehicle.vehicleNumber}</h1>
          <Badge variant={vehicle.isActive ? "default" : "secondary"}>
            {vehicle.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {[vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" · ") || "No details"}
        </p>
      </div>

      <QrDisplay qrCode={vehicle.qrCode} qrShortCode={vehicle.qrShortCode} vehicleNumber={vehicle.vehicleNumber} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" aria-hidden="true" />
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Make</dt>
              <dd className="font-medium">{vehicle.make ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Model</dt>
              <dd className="font-medium">{vehicle.model ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Color</dt>
              <dd className="font-medium">{vehicle.color ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Short Code</dt>
              <dd className="font-medium font-mono">{vehicle.qrShortCode}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
