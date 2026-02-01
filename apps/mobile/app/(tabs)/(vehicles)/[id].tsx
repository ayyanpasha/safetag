import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { QRDisplay } from "@/components/vehicles/qr-display";
import { useVehicle, useDeleteVehicle } from "@/lib/hooks/use-vehicles";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: vehicle, isLoading } = useVehicle(id);
  const deleteVehicle = useDeleteVehicle();

  if (isLoading || !vehicle) return <Spinner fullScreen />;

  const handleDelete = () => {
    Alert.alert("Delete Vehicle", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteVehicle.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title={vehicle.vehicleNumber} showBack />
      <View className="flex-1 px-4 gap-4 pt-4">
        <Card className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">
              {vehicle.vehicleNumber}
            </Text>
            <Badge variant={vehicle.isActive ? "success" : "outline"}>
              {vehicle.isActive ? "Active" : "Inactive"}
            </Badge>
          </View>
          {vehicle.make || vehicle.model || vehicle.color ? (
            <Text className="text-sm text-muted-foreground">
              {[vehicle.make, vehicle.model, vehicle.color]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : null}
        </Card>

        <QRDisplay
          qrCode={vehicle.qrCode}
          shortCode={vehicle.qrShortCode}
          vehicleNumber={vehicle.vehicleNumber}
        />

        <Button variant="destructive" onPress={handleDelete}>
          Delete Vehicle
        </Button>
      </View>
    </SafeAreaView>
  );
}
