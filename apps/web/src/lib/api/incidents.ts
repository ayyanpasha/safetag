import { api } from "./client";

export interface Incident {
  id: string;
  vehicleId: string;
  ownerId: string;
  scannerPhone: string | null;
  emergencyType: string;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
}

export function getIncidents(status?: string) {
  const params = status ? `?status=${status}` : "";
  return api.get<Incident[]>(`/api/incidents${params}`);
}

export function getIncident(id: string) {
  return api.get<Incident>(`/api/incidents/${id}`);
}

export function updateIncidentStatus(id: string, status: string) {
  return api.put<Incident>(`/api/incidents/${id}`, { status });
}
