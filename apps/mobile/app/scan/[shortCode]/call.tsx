import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActiveCall } from "@/components/scanner/active-call";
import { initiateVoipCall, sendVoipOtp } from "@/lib/api/contact";
import { useScannerStore } from "@/lib/stores/scanner-store";
import { useWebRTC } from "@/lib/hooks/use-webrtc";

export default function CallScreen() {
  const router = useRouter();
  const sessionToken = useScannerStore((s) => s.sessionToken);
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [callData, setCallData] = useState<{
    signalingUrl: string;
    callId: string;
  } | null>(null);

  const webrtc = useWebRTC({
    signalingUrl: callData?.signalingUrl ?? "",
    callId: callData?.callId ?? "",
    onEnded: () => {},
  });

  const handleSendOtp = async () => {
    if (!sessionToken) return;
    await sendVoipOtp(sessionToken);
    setOtpSent(true);
  };

  const handleCall = async () => {
    if (!sessionToken) return;
    const res = await initiateVoipCall({ sessionToken, phone, otp });
    if (res.success && res.data) {
      setCallData(res.data);
      webrtc.connect();
    }
  };

  if (callData) {
    return (
      <ActiveCall
        status={webrtc.status}
        duration={webrtc.duration}
        isMuted={webrtc.isMuted}
        isSpeaker={webrtc.isSpeaker}
        onToggleMute={webrtc.toggleMute}
        onToggleSpeaker={webrtc.toggleSpeaker}
        onHangUp={() => {
          webrtc.hangUp();
          router.dismissAll();
        }}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="VoIP Call" showBack />
      <View className="flex-1 px-4 pt-4 gap-4">
        <Input
          label="Your Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        {!otpSent ? (
          <Button variant="outline" onPress={handleSendOtp}>
            Send OTP
          </Button>
        ) : (
          <>
            <Input
              label="OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button onPress={handleCall} disabled={otp.length !== 6}>
              Start Call
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
