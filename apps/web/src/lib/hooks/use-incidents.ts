"use client";

import { useState, useEffect, useCallback } from "react";
import { getIncidents, type Incident } from "@/lib/api/incidents";

export function useIncidents(statusFilter?: string) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await getIncidents(statusFilter);
    if (res.success && res.data) setIncidents(res.data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  return { incidents, loading, refresh };
}
