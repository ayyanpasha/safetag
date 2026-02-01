import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { PLAN_DETAILS } from "@safetag/shared-types";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) return <Spinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Subscription" showBack />
      <View className="flex-1 px-4 gap-4 pt-4">
        {subscription ? (
          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">
                {subscription.plan.replace("_", " ")} Plan
              </Text>
              <Badge
                variant={
                  subscription.status === "ACTIVE" ? "success" : "warning"
                }
              >
                {subscription.status}
              </Badge>
            </View>
            <Text className="text-2xl font-bold text-primary">
              {formatCurrency(PLAN_DETAILS[subscription.plan].price)}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Valid until {formatDate(subscription.currentPeriodEnd)}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {subscription.vehicleLimit} vehicles allowed
            </Text>
          </Card>
        ) : (
          <Card className="gap-3 items-center">
            <Text className="text-lg font-semibold text-foreground">
              No Active Plan
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              Subscribe to protect your vehicles
            </Text>
          </Card>
        )}
        <Button onPress={() => router.push("/(tabs)/(profile)/upgrade")}>
          {subscription ? "Change Plan" : "Subscribe Now"}
        </Button>
      </View>
    </SafeAreaView>
  );
}
