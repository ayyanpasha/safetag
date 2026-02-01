import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Car, Plus } from "lucide-react-native";
import { Header } from "@/components/layout/header";
import { VehicleCard } from "@/components/dashboard/vehicle-card";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useVehicles } from "@/lib/hooks/use-vehicles";
import { Pressable } from "react-native";
import { colors } from "@/lib/constants/colors";

export default function VehicleListScreen() {
  const router = useRouter();
  const { data: vehicles, isLoading, refetch } = useVehicles();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header
        title="Vehicles"
        right={
          <Pressable onPress={() => router.push("/(tabs)/(vehicles)/new")}>
            <Plus size={24} color={colors.primary} />
          </Pressable>
        }
      />
      {isLoading ? (
        <Spinner fullScreen />
      ) : !vehicles?.length ? (
        <EmptyState
          icon={Car}
          title="No Vehicles"
          description="Add your first vehicle to get started"
          action={
            <Button onPress={() => router.push("/(tabs)/(vehicles)/new")}>
              Add Vehicle
            </Button>
          }
        />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onPress={() => router.push(`/(tabs)/(vehicles)/${item.id}`)}
            />
          )}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onRefresh={refetch}
          refreshing={false}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
}
