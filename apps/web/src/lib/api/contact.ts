import { api } from "./client";
import type { ProblemType, EmergencyType } from "@safetag/shared-types";

export function sendWhatsAppComplaint(data: {
  sessionToken: string;
  problemType: ProblemType;
  language?: string;
}) {
  return api.post<{ message: string }>("/api/contact/whatsapp/complaint", data);
}

export function initiateVoipCall(data: {
  sessionToken: string;
  phone: string;
  otp: string;
}) {
  return api.post<{ signalingUrl: string; callId: string }>("/api/contact/voip/initiate", data);
}

export function sendVoipOtp(sessionToken: string, phone: string) {
  return api.post<{ message: string; otp?: string }>("/api/contact/voip/otp", { sessionToken, phone });
}

export function reportEmergency(formData: FormData) {
  return api.upload<{ incidentId: string }>("/api/contact/emergency", formData);
}
