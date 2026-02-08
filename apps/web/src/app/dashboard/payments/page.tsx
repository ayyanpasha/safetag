"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { getBillingHistory } from "@/lib/api/payments";
import { SubscriptionBadge } from "@/components/dashboard/subscription-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CreditCard } from "lucide-react";
import { PLAN_DETAILS } from "@safetag/shared-types";

export default function PaymentsPage() {
  const { subscription, loading: sLoading } = useSubscription();
  const [history, setHistory] = useState<Array<{ id: string; amount: number; currency: string; status: string; createdAt: string }>>([]);
  const [hLoading, setHLoading] = useState(true);

  useEffect(() => {
    getBillingHistory().then((res) => {
      if (res.success && res.data) setHistory(res.data);
      setHLoading(false);
    });
  }, []);

  if (sLoading || hLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Manage your subscription and billing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{subscription.plan.replace(/_/g, " ")}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(PLAN_DETAILS[subscription.plan].price)} · Up to {subscription.vehicleLimit} vehicles
                  </p>
                </div>
                <SubscriptionBadge status={subscription.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                Current period: {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
              </p>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/dashboard/payments/upgrade">Change Plan</Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">No active subscription</p>
              <Button asChild className="min-h-[44px]">
                <Link href="/dashboard/payments/upgrade">Subscribe Now</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState icon={CreditCard} title="No payments" description="No payment history yet." />
          ) : (
            <div className="space-y-2">
              {history.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                  </div>
                  <span className="text-xs font-medium capitalize">{payment.status.toLowerCase()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
