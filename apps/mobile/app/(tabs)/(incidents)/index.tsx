import { useState } from "react";
import { FlatList, View, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShieldAlert } from "lucide-react-native";
import { Header } from "@/components/layout/header";
import { IncidentRow } from "@/components/dashboard/incident-row";
import { EmptyState } from "@/components/layout/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useIncidents } from "@/lib/hooks/use-incidents";

const filters = ["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as const;

export default function IncidentListScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const { data: incidents, isLoading, refetch } = useIncidents(
    filter === "ALL" ? undefined : filter
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Incidents" />
      <View className="flex-row gap-2 px-4 pb-2">
        {filters.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 ${
              filter === f ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                filter === f ? "text-white" : "text-muted-foreground"
              }`}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? (
        <Spinner fullScreen />
      ) : !incidents?.length ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Incidents"
          description="No incidents reported yet"
        />
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IncidentRow
              incident={item}
              onPress={() => router.push(`/(tabs)/(incidents)/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          onRefresh={refetch}
          refreshing={false}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
}
