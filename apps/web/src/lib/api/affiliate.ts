import { api } from "./client";
import type { Affiliate } from "@safetag/shared-types";

export interface Referral {
  id: string;
  referredUserId: string;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  amount: number;
  status: string;
  processedAt: string | null;
  createdAt: string;
}

export function getDealerProfile() {
  return api.get<Affiliate>("/api/affiliate/profile");
}

export function getReferrals() {
  return api.get<Referral[]>("/api/affiliate/referrals");
}

export function getPayouts() {
  return api.get<Payout[]>("/api/affiliate/payouts");
}

export function requestPayout() {
  return api.post<{ payoutId: string }>("/api/affiliate/payouts/request");
}
