import { api } from "./client";

interface ValidateResult {
  valid: boolean;
  maskedNumber?: string;
}

interface ScanResult {
  sessionToken: string;
  vehicleNumber: string;
  make: string | null;
  model: string | null;
  color: string | null;
}

export function validateQR(shortCode: string) {
  return api.get<ValidateResult>(`/api/scan/validate/${shortCode}`);
}

export function initiateScan(data: {
  shortCode: string;
  vehicleNumber: string;
  location: { latitude: number; longitude: number };
  fingerprint: string;
}) {
  return api.post<ScanResult>("/api/scan/initiate", data);
}
