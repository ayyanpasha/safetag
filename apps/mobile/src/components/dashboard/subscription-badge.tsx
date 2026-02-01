import { View, Text } from "react-native";
import { Badge } from "@/components/ui/badge";
import type { Subscription } from "@safetag/shared-types";

interface SubscriptionBadgeProps {
  subscription: Subscription | null;
}

export function SubscriptionBadge({ subscription }: SubscriptionBadgeProps) {
  if (!subscription) {
    return (
      <Badge variant="outline">No Plan</Badge>
    );
  }

  const variant =
    subscription.status === "ACTIVE"
      ? "success"
      : subscription.status === "PAST_DUE"
        ? "warning"
        : "destructive";

  return (
    <View className="flex-row items-center gap-2">
      <Badge variant={variant}>{subscription.status}</Badge>
      <Text className="text-sm text-muted-foreground">{subscription.plan}</Text>
    </View>
  );
}
