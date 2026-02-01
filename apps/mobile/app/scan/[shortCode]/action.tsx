import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { ActionCards } from "@/components/scanner/action-cards";

export default function ActionScreen() {
  const { shortCode } = useLocalSearchParams<{ shortCode: string }>();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Contact Owner" showBack />
      <View className="flex-1 px-4 pt-4">
        <ActionCards
          onWhatsApp={() => router.push(`/scan/${shortCode}/whatsapp`)}
          onCall={() => router.push(`/scan/${shortCode}/call`)}
          onEmergency={() => router.push(`/scan/${shortCode}/emergency`)}
        />
      </View>
    </SafeAreaView>
  );
}
