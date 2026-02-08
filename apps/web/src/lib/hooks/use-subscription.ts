"use client";

import { useState, useEffect } from "react";
import { getSubscription } from "@/lib/api/payments";
import type { Subscription } from "@safetag/shared-types";

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscription().then((res) => {
      if (res.success && res.data) setSubscription(res.data);
      setLoading(false);
    });
  }, []);

  return { subscription, loading };
}
