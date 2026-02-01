import { Pressable, View, Text } from "react-native";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronRight } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";
import { formatDate } from "@/lib/utils/format";
import type { Incident } from "@/lib/api/incidents";

interface IncidentRowProps {
  incident: Incident;
  onPress: () => void;
}

const statusVariant = {
  OPEN: "destructive",
  ACKNOWLEDGED: "warning",
  RESOLVED: "success",
} as const;

export function IncidentRow({ incident, onPress }: IncidentRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border py-3"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle size={18} color={colors.destructive} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">
          {incident.emergencyType.replace("_", " ")}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {formatDate(incident.createdAt)}
        </Text>
      </View>
      <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}
