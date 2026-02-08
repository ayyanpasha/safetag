import { api } from "./client";
import type { UserProfile } from "@safetag/shared-types";

export function sendOtp(phone: string) {
  return api.post<{ message: string }>("/api/auth/otp/send", { phone });
}

export function verifyOtp(phone: string, otp: string) {
  return api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
    "/api/auth/otp/verify",
    { phone, otp }
  );
}

export function getProfile() {
  return api.get<UserProfile>("/api/auth/profile");
}

export function updateProfile(data: { name?: string; email?: string; emergencyContact?: string; dndEnabled?: boolean; dndStart?: string | null; dndEnd?: string | null }) {
  return api.put<UserProfile>("/api/auth/profile", data);
}
