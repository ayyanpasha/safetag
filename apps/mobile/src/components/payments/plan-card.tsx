import { View, Text, Pressable } from "react-native";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import type { PlanType } from "@safetag/shared-types";
import { PLAN_DETAILS } from "@safetag/shared-types";

interface PlanCardProps {
  plan: PlanType;
  isActive?: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, isActive, onSelect }: PlanCardProps) {
  const details = PLAN_DETAILS[plan];
  return (
    <Pressable onPress={onSelect}>
      <Card
        className={`gap-2 ${isActive ? "border-primary border-2" : ""}`}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">
            {plan.replace("_", " ")}
          </Text>
          {isActive ? <Badge variant="success">Current</Badge> : null}
        </View>
        <Text className="text-2xl font-bold text-primary">
          {formatCurrency(details.price)}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {details.duration} month{details.duration > 1 ? "s" : ""} ·{" "}
          {details.vehicleLimit} vehicles
        </Text>
      </Card>
    </Pressable>
  );
}
