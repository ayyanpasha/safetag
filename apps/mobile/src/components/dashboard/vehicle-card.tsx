import { Pressable, View, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";
import type { Vehicle } from "@safetag/shared-types";

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Car size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {vehicle.vehicleNumber}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {[vehicle.make, vehicle.model, vehicle.color]
              .filter(Boolean)
              .join(" · ") || "No details"}
          </Text>
        </View>
        <Badge variant={vehicle.isActive ? "success" : "outline"}>
          {vehicle.isActive ? "Active" : "Inactive"}
        </Badge>
        <ChevronRight size={16} color={colors.mutedForeground} />
      </Card>
    </Pressable>
  );
}
