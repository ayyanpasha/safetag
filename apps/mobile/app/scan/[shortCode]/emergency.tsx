import { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { EmergencyForm } from "@/components/scanner/emergency-form";
import { Button } from "@/components/ui/button";
import { reportEmergency } from "@/lib/api/contact";
import { sendVoipOtp } from "@/lib/api/contact";
import { useScannerStore } from "@/lib/stores/scanner-store";
import type { EmergencyType } from "@safetag/shared-types";

export default function EmergencyScreen() {
  const router = useRouter();
  const sessionToken = useScannerStore((s) => s.sessionToken);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async (phone: string) => {
    if (!sessionToken) return;
    await sendVoipOtp(sessionToken);
    setOtpSent(true);
  };

  const handleSubmit = async (data: {
    phone: string;
    otp: string;
    emergencyType: EmergencyType;
  }) => {
    if (!sessionToken) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("sessionToken", sessionToken);
    formData.append("phone", data.phone);
    formData.append("otp", data.otp);
    formData.append("emergencyType", data.emergencyType);

    const res = await reportEmergency(formData);
    setLoading(false);
    if (res.success) setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center gap-4 px-8">
        <Text className="text-xl font-bold text-foreground">
          Report Submitted
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          Emergency services and the vehicle owner have been notified.
        </Text>
        <Button onPress={() => router.dismissAll()}>Done</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Emergency Report" showBack />
      <View className="flex-1 px-4 pt-4">
        <EmergencyForm
          onSubmit={handleSubmit}
          onSendOtp={handleSendOtp}
          loading={loading}
          otpSent={otpSent}
        />
      </View>
    </SafeAreaView>
  );
}
