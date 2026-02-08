"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createVehicle } from "@/lib/api/vehicles";

export default function NewVehiclePage() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const formatted = vehicleNumber.toUpperCase().replace(/\s/g, "");
    if (formatted.length < 4) {
      setError("Please enter a valid vehicle number");
      return;
    }
    setLoading(true);
    const res = await createVehicle({
      vehicleNumber: formatted,
      make: make || undefined,
      model: model || undefined,
      color: color || undefined,
    });
    if (res.success && res.data) {
      router.push(`/dashboard/vehicles/${res.data.id}`);
    } else {
      setError(res.error ?? "Failed to add vehicle");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Vehicle</CardTitle>
          <CardDescription>Register a new vehicle to get your SafeTag QR code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                placeholder="e.g. KA01AB1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? "form-error" : undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" placeholder="e.g. Toyota" value={make} onChange={(e) => setMake(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="e.g. Innova" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="e.g. White" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            {error && <p id="form-error" className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
              {loading ? "Adding..." : "Add Vehicle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
