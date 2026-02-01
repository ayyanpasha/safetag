import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getIncidents,
  getIncident,
  updateIncidentStatus,
} from "@/lib/api/incidents";
import { QUERY_STALE_TIME } from "@/lib/constants/config";

export function useIncidents(status?: string) {
  return useQuery({
    queryKey: ["incidents", status],
    queryFn: async () => {
      const res = await getIncidents(status);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incidents", id],
    queryFn: async () => {
      const res = await getIncident(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUpdateIncidentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateIncidentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
  });
}
