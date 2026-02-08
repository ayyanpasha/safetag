import { api } from "./client";
import type { Vehicle } from "@safetag/shared-types";

export function getVehicles() {
  return api.get<Vehicle[]>("/api/vehicles");
}

export function getVehicle(id: string) {
  return api.get<Vehicle>(`/api/vehicles/${id}`);
}

export function createVehicle(data: { vehicleNumber: string; make?: string; model?: string; color?: string }) {
  return api.post<Vehicle>("/api/vehicles", data);
}

export function deleteVehicle(id: string) {
  return api.delete<void>(`/api/vehicles/${id}`);
}
