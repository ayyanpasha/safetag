"use client";

import { useRouter } from "next/navigation";
import { PlanCard } from "@/components/dashboard/plan-card";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { createSubscription } from "@/lib/api/payments";
import { PLAN_DETAILS, type PlanType } from "@safetag/shared-types";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";

const plans: { key: PlanType; name: string; duration: string; popular?: boolean; bestValue?: boolean }[] = [
  { key: "MONTHLY", name: "Monthly", duration: "mo" },
  { key: "QUARTERLY", name: "Quarterly", duration: "qtr", popular: true },
  { key: "SEMI_ANNUAL", name: "Semi-Annual", duration: "6mo" },
  { key: "YEARLY", name: "Yearly", duration: "yr", bestValue: true },
];

export default function UpgradePage() {
  const { subscription, loading } = useSubscription();
  const router = useRouter();

  if (loading) return <LoadingSkeleton />;

  async function handleSelect(plan: PlanType) {
    // In a real implementation, you'd select a vehicle and handle Razorpay checkout
    const res = await createSubscription(plan, "");
    if (res.success) {
      router.push("/dashboard/payments");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Choose a Plan</h1>
        <p className="text-muted-foreground">Select the plan that works best for you. Per-vehicle pricing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.key}
            name={plan.name}
            price={PLAN_DETAILS[plan.key].price}
            duration={plan.duration}
            vehicleLimit={PLAN_DETAILS[plan.key].vehicleLimit}
            popular={plan.popular}
            bestValue={plan.bestValue}
            current={subscription?.plan === plan.key}
            onSelect={() => handleSelect(plan.key)}
          />
        ))}
      </div>
    </div>
  );
}
