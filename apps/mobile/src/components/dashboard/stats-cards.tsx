import { View, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { Car, ShieldAlert, QrCode, Shield } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";

interface StatsCardsProps {
  vehicleCount: number;
  incidentCount: number;
  scanCount: number;
  planName: string | null;
}

export function StatsCards({
  vehicleCount,
  incidentCount,
  scanCount,
  planName,
}: StatsCardsProps) {
  const stats = [
    { label: "Vehicles", value: vehicleCount, icon: Car, color: colors.primary },
    { label: "Incidents", value: incidentCount, icon: ShieldAlert, color: colors.destructive },
    { label: "Scans", value: scanCount, icon: QrCode, color: colors.success },
    { label: "Plan", value: planName ?? "Free", icon: Shield, color: colors.warning },
  ];

  return (
    <View className="flex-row flex-wrap gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex-1 min-w-[45%]">
          <View className="flex-row items-center gap-2">
            <stat.icon size={20} color={stat.color} />
            <Text className="text-sm text-muted-foreground">{stat.label}</Text>
          </View>
          <Text className="mt-1 text-2xl font-bold text-foreground">
            {typeof stat.value === "number" ? stat.value : stat.value}
          </Text>
        </Card>
      ))}
    </View>
  );
}
