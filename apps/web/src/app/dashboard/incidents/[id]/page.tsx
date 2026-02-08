"use client";

import { use, useState, useEffect } from "react";
import { getIncident, updateIncidentStatus, type Incident } from "@/lib/api/incidents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { formatDateTime } from "@/lib/utils/format";
import { AlertTriangle, MapPin } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "destructive",
  ACKNOWLEDGED: "default",
  RESOLVED: "secondary",
};

export default function IncidentDetailPage({ params }: Props) {
  const { id } = use(params);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getIncident(id).then((res) => {
      if (res.success && res.data) setIncident(res.data);
      setLoading(false);
    });
  }, [id]);

  async function handleStatusUpdate(status: string) {
    setUpdating(true);
    const res = await updateIncidentStatus(id, status);
    if (res.success && res.data) setIncident(res.data);
    setUpdating(false);
  }

  if (loading) return <LoadingSkeleton />;
  if (!incident) return <p className="text-center py-12 text-muted-foreground">Incident not found.</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
          <h1 className="text-2xl font-bold">{incident.emergencyType.replace(/_/g, " ")}</h1>
          <Badge variant={statusColors[incident.status] ?? "secondary"}>{incident.status}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">{formatDateTime(incident.createdAt)}</p>
      </div>

      {incident.photoUrl && (
        <Card>
          <CardContent className="p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={incident.photoUrl} alt="Incident photo" className="w-full rounded-lg max-h-96 object-cover" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{incident.emergencyType.replace(/_/g, " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd><Badge variant={statusColors[incident.status] ?? "secondary"}>{incident.status}</Badge></dd>
            </div>
            {(incident.latitude && incident.longitude) && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" /> Location
                </dt>
                <dd className="font-mono text-xs">{incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Reported</dt>
              <dd>{formatDateTime(incident.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {incident.status !== "RESOLVED" && (
        <div className="flex gap-3">
          {incident.status === "OPEN" && (
            <Button onClick={() => handleStatusUpdate("ACKNOWLEDGED")} disabled={updating} className="min-h-[44px]">
              Acknowledge
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => handleStatusUpdate("RESOLVED")}
            disabled={updating}
            className="min-h-[44px]"
          >
            Mark Resolved
          </Button>
        </div>
      )}
    </div>
  );
}
