import { View, Text } from "react-native";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface BillingRowProps {
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export function BillingRow({ amount, status, createdAt }: BillingRowProps) {
  const variant =
    status === "paid"
      ? "success"
      : status === "pending"
        ? "warning"
        : "destructive";

  return (
    <View className="flex-row items-center justify-between border-b border-border py-3">
      <View>
        <Text className="text-base font-medium text-foreground">
          {formatCurrency(amount)}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {formatDate(createdAt)}
        </Text>
      </View>
      <Badge variant={variant}>{status}</Badge>
    </View>
  );
}
