import { View, Text, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVehicles } from "@/lib/hooks/use-vehicles";
import { useIncidents } from "@/lib/hooks/use-incidents";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VehicleCard } from "@/components/dashboard/vehicle-card";
import { IncidentRow } from "@/components/dashboard/incident-row";
import { Spinner } from "@/components/ui/spinner";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: vehicles, isLoading: vLoading } = useVehicles();
  const { data: incidents, isLoading: iLoading } = useIncidents();
  const { data: subscription } = useSubscription();

  if (vLoading || iLoading) return <Spinner fullScreen />;

  const recentIncidents = (incidents ?? []).slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mt-4 text-2xl font-bold text-foreground">
          Hi, {user?.name ?? "there"} 👋
        </Text>

        <View className="mt-6">
          <StatsCards
            vehicleCount={vehicles?.length ?? 0}
            incidentCount={incidents?.length ?? 0}
            scanCount={0}
            planName={subscription?.plan ?? null}
          />
        </View>

        {vehicles && vehicles.length > 0 ? (
          <View className="mt-6 gap-2">
            <Text className="text-lg font-semibold text-foreground">
              Your Vehicles
            </Text>
            {vehicles.slice(0, 3).map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onPress={() => router.push(`/(tabs)/(vehicles)/${v.id}`)}
              />
            ))}
          </View>
        ) : null}

        {recentIncidents.length > 0 ? (
          <View className="mt-6 gap-1">
            <Text className="text-lg font-semibold text-foreground">
              Recent Incidents
            </Text>
            {recentIncidents.map((inc) => (
              <IncidentRow
                key={inc.id}
                incident={inc}
                onPress={() => router.push(`/(tabs)/(incidents)/${inc.id}`)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
