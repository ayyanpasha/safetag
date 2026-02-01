import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { useCreateVehicle } from "@/lib/hooks/use-vehicles";

export default function NewVehicleScreen() {
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  const handleSubmit = async (data: {
    vehicleNumber: string;
    make?: string;
    model?: string;
    color?: string;
  }) => {
    const res = await createVehicle.mutateAsync(data);
    if (res.success) {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Add Vehicle" showBack />
      <View className="px-4 pt-4">
        <VehicleForm onSubmit={handleSubmit} loading={createVehicle.isPending} />
      </View>
    </SafeAreaView>
  );
}
