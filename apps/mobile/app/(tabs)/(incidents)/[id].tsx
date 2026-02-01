import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useIncident, useUpdateIncidentStatus } from "@/lib/hooks/use-incidents";
import { formatDate } from "@/lib/utils/format";

const statusVariant = {
  OPEN: "destructive",
  ACKNOWLEDGED: "warning",
  RESOLVED: "success",
} as const;

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: incident, isLoading } = useIncident(id);
  const updateStatus = useUpdateIncidentStatus();

  if (isLoading || !incident) return <Spinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Incident" showBack />
      <View className="flex-1 px-4 gap-4 pt-4">
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">
              {incident.emergencyType.replace("_", " ")}
            </Text>
            <Badge variant={statusVariant[incident.status]}>
              {incident.status}
            </Badge>
          </View>
          <Text className="text-sm text-muted-foreground">
            Reported {formatDate(incident.createdAt)}
          </Text>
          {incident.latitude && incident.longitude ? (
            <Text className="text-xs text-muted-foreground">
              Location: {incident.latitude.toFixed(4)},{" "}
              {incident.longitude.toFixed(4)}
            </Text>
          ) : null}
        </Card>

        {incident.photoUrl ? (
          <Image
            source={{ uri: incident.photoUrl }}
            style={{ width: "100%", height: 200, borderRadius: 12 }}
            contentFit="cover"
          />
        ) : null}

        {incident.status === "OPEN" ? (
          <Button
            onPress={() =>
              updateStatus.mutate({ id, status: "ACKNOWLEDGED" })
            }
            loading={updateStatus.isPending}
          >
            Acknowledge
          </Button>
        ) : incident.status === "ACKNOWLEDGED" ? (
          <Button
            onPress={() => updateStatus.mutate({ id, status: "RESOLVED" })}
            loading={updateStatus.isPending}
          >
            Resolve
          </Button>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
