import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { VerifyForm } from "@/components/scanner/verify-form";
import { initiateScan } from "@/lib/api/scanner";
import { useScannerStore } from "@/lib/stores/scanner-store";
import { useLocation } from "@/lib/hooks/use-location";
import { useState } from "react";

export default function VerifyScreen() {
  const { shortCode } = useLocalSearchParams<{ shortCode: string }>();
  const router = useRouter();
  const setSession = useScannerStore((s) => s.setSession);
  const { requestLocation } = useLocation();
  const [loading, setLoading] = useState(false);

  const handleVerify = async (vehicleNumber: string) => {
    setLoading(true);
    const location = await requestLocation();
    if (!location) {
      setLoading(false);
      return;
    }

    const res = await initiateScan({
      shortCode,
      vehicleNumber,
      location,
      fingerprint: "mobile-app",
    });

    if (res.success && res.data) {
      setSession(res.data);
      router.replace(`/scan/${shortCode}/action`);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Verify Vehicle" showBack />
      <View className="flex-1 px-4 pt-8">
        <VerifyForm onVerify={handleVerify} loading={loading} />
      </View>
    </SafeAreaView>
  );
}
