import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVehicles,
  getVehicle,
  createVehicle,
  deleteVehicle,
} from "@/lib/api/vehicles";
import { QUERY_STALE_TIME } from "@/lib/constants/config";

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await getVehicles();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: async () => {
      const res = await getVehicle(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
