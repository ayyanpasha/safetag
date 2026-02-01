import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { PlanCard } from "@/components/payments/plan-card";
import { useSubscription, useCreateSubscription } from "@/lib/hooks/use-subscription";
import { useVehicles } from "@/lib/hooks/use-vehicles";
import type { PlanType } from "@safetag/shared-types";

const plans: PlanType[] = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "YEARLY"];

export default function UpgradeScreen() {
  const router = useRouter();
  const { data: subscription } = useSubscription();
  const { data: vehicles } = useVehicles();
  const createSub = useCreateSubscription();

  const handleSelect = async (plan: PlanType) => {
    const vehicleId = vehicles?.[0]?.id;
    if (!vehicleId) {
      Alert.alert("No Vehicle", "Add a vehicle first before subscribing.");
      return;
    }

    const res = await createSub.mutateAsync({ plan, vehicleId });
    if (res.success && res.data) {
      // In production, open Razorpay with res.data.razorpayOrderId
      Alert.alert("Success", "Subscription created!");
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Choose a Plan" showBack />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 12, paddingVertical: 16 }}>
        {plans.map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            isActive={subscription?.plan === plan}
            onSelect={() => handleSelect(plan)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
