import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscription,
  createSubscription,
  getBillingHistory,
} from "@/lib/api/payments";
import type { PlanType } from "@safetag/shared-types";
import { QUERY_STALE_TIME } from "@/lib/constants/config";

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await getSubscription();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plan, vehicleId }: { plan: PlanType; vehicleId: string }) =>
      createSubscription(plan, vehicleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}

export function useBillingHistory() {
  return useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      const res = await getBillingHistory();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });
}
