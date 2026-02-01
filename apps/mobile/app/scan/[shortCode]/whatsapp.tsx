import { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { ProblemSelector } from "@/components/scanner/problem-selector";
import { Button } from "@/components/ui/button";
import { sendWhatsAppComplaint } from "@/lib/api/contact";
import { useScannerStore } from "@/lib/stores/scanner-store";
import type { ProblemType } from "@safetag/shared-types";

export default function WhatsAppScreen() {
  const router = useRouter();
  const sessionToken = useScannerStore((s) => s.sessionToken);
  const [selected, setSelected] = useState<ProblemType | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!sessionToken || !selected) return;
    setLoading(true);
    const res = await sendWhatsAppComplaint({
      sessionToken,
      problemType: selected,
    });
    setLoading(false);
    if (res.success) setSent(true);
  };

  if (sent) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center gap-4 px-8">
        <Text className="text-xl font-bold text-foreground">Message Sent!</Text>
        <Text className="text-sm text-muted-foreground text-center">
          The vehicle owner has been notified via WhatsApp.
        </Text>
        <Button onPress={() => router.dismissAll()}>Done</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="WhatsApp" showBack />
      <View className="flex-1 px-4 pt-4 gap-6">
        <ProblemSelector selected={selected} onSelect={setSelected} />
        <Button
          onPress={handleSend}
          loading={loading}
          disabled={!selected}
        >
          Send Message
        </Button>
      </View>
    </SafeAreaView>
  );
}
