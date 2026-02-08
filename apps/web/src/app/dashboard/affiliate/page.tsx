"use client";

import { useState, useEffect } from "react";
import { getDealerProfile, getReferrals, getPayouts, requestPayout, type Referral, type Payout } from "@/lib/api/affiliate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Users, Copy } from "lucide-react";
import type { Affiliate } from "@safetag/shared-types";

export default function AffiliatePage() {
  const [dealer, setDealer] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Promise.all([getDealerProfile(), getReferrals(), getPayouts()]).then(([d, r, p]) => {
      if (d.success && d.data) setDealer(d.data);
      if (r.success && r.data) setReferrals(r.data);
      if (p.success && p.data) setPayouts(p.data);
      setLoading(false);
    });
  }, []);

  async function handleRequestPayout() {
    setRequesting(true);
    await requestPayout();
    const p = await getPayouts();
    if (p.success && p.data) setPayouts(p.data);
    setRequesting(false);
  }

  if (loading) return <LoadingSkeleton />;

  if (!dealer) {
    return (
      <EmptyState
        icon={Users}
        title="Not a dealer"
        description="You don't have a dealer account. Contact support to become an affiliate."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">Track your referrals and earnings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Dealer Code</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono">{dealer.dealerCode}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigator.clipboard.writeText(dealer.dealerCode)}
                aria-label="Copy dealer code"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Referrals</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{dealer.totalReferrals}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Earnings</CardTitle></CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{formatCurrency(dealer.totalEarnings)}</span>
            <Button variant="outline" size="sm" className="ml-3" onClick={handleRequestPayout} disabled={requesting}>
              Request Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Referrals</CardTitle></CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No referrals yet.</p>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm">{formatCurrency(r.commissionAmount)} commission</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <Badge variant="secondary">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payouts</CardTitle></CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payouts yet.</p>
          ) : (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                  </div>
                  <Badge variant="secondary">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
