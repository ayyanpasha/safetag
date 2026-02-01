import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/layout/empty-state";
import { getDealerProfile, getReferrals, requestPayout } from "@/lib/api/affiliate";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Users } from "lucide-react-native";
import { QUERY_STALE_TIME } from "@/lib/constants/config";

export default function AffiliateScreen() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["affiliate"],
    queryFn: async () => {
      const res = await getDealerProfile();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });

  const { data: referrals } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const res = await getReferrals();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: QUERY_STALE_TIME,
  });

  const payout = useMutation({ mutationFn: requestPayout });

  if (isLoading) return <Spinner fullScreen />;

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <Header title="Affiliate" showBack />
        <EmptyState
          icon={Users}
          title="Not a Dealer"
          description="Contact us to become an affiliate dealer"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Affiliate" showBack />
      <View className="flex-1 px-4 pt-4 gap-4">
        <Card className="gap-2">
          <Text className="text-sm text-muted-foreground">Dealer Code</Text>
          <Text className="text-lg font-bold text-foreground">
            {profile.dealerCode}
          </Text>
          <View className="flex-row gap-4 mt-2">
            <View>
              <Text className="text-xs text-muted-foreground">Referrals</Text>
              <Text className="text-xl font-bold text-foreground">
                {profile.totalReferrals}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Earnings</Text>
              <Text className="text-xl font-bold text-primary">
                {formatCurrency(profile.totalEarnings)}
              </Text>
            </View>
          </View>
        </Card>

        <Button
          variant="outline"
          onPress={() => payout.mutate()}
          loading={payout.isPending}
        >
          Request Payout
        </Button>

        {referrals?.length ? (
          <FlatList
            data={referrals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between border-b border-border py-3">
                <View>
                  <Text className="text-sm text-foreground">
                    {formatCurrency(item.commissionAmount)}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Badge variant={item.status === "paid" ? "success" : "warning"}>
                  {item.status}
                </Badge>
              </View>
            )}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
