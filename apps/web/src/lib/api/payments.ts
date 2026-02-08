import { api } from "./client";
import type { Subscription, PlanType } from "@safetag/shared-types";

export function getSubscription() {
  return api.get<Subscription>("/api/payments/subscription");
}

export function createSubscription(plan: PlanType, vehicleId: string) {
  return api.post<{ subscriptionId: string; razorpayOrderId: string }>("/api/payments/subscribe", { plan, vehicleId });
}

export function getBillingHistory() {
  return api.get<Array<{ id: string; amount: number; currency: string; status: string; createdAt: string }>>("/api/payments/history");
}
