import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Shield } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { useSendOtp, useVerifyOtp } from "@/lib/hooks/use-auth";
import { colors } from "@/lib/constants/colors";

export default function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+91");
  const [error, setError] = useState("");

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const handleSendOtp = async () => {
    setError("");
    const res = await sendOtp.mutateAsync(phone);
    if (res.success) {
      setStep("otp");
    } else {
      setError(res.error ?? "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setError("");
    const res = await verifyOtp.mutateAsync({ phone, otp });
    if (res.success) {
      router.replace("/(tabs)/(home)");
    } else {
      setError(res.error ?? "Invalid OTP");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center gap-2 mb-10">
          <Shield size={48} color={colors.primary} />
          <Text className="text-2xl font-bold text-foreground">SafeTag</Text>
          <Text className="text-sm text-muted-foreground">
            Protect your vehicle with a QR code
          </Text>
        </View>

        {step === "phone" ? (
          <View className="gap-4">
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+919876543210"
              error={error}
            />
            <Button onPress={handleSendOtp} loading={sendOtp.isPending}>
              Send OTP
            </Button>
          </View>
        ) : (
          <View className="gap-4">
            <Text className="text-center text-sm text-muted-foreground">
              Enter the 6-digit code sent to {phone}
            </Text>
            <OtpInput onComplete={handleVerifyOtp} />
            {error ? (
              <Text className="text-center text-sm text-destructive">
                {error}
              </Text>
            ) : null}
            {verifyOtp.isPending ? (
              <Text className="text-center text-sm text-muted-foreground">
                Verifying...
              </Text>
            ) : null}
            <Button variant="ghost" onPress={() => setStep("phone")}>
              Change Number
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
