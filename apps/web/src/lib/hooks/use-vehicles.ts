"use client";

import { useState, useEffect, useCallback } from "react";
import { getVehicles, getVehicle } from "@/lib/api/vehicles";
import type { Vehicle } from "@safetag/shared-types";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await getVehicles();
    if (res.success && res.data) setVehicles(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { vehicles, loading, refresh };
}

export function useVehicle(id: string) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVehicle(id).then((res) => {
      if (res.success && res.data) setVehicle(res.data);
      setLoading(false);
    });
  }, [id]);

  return { vehicle, loading };
}
