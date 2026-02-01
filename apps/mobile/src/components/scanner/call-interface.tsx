import { View, Text, Pressable } from "react-native";
import { Phone, Mic, MicOff, Volume2, PhoneOff } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";
import { formatDuration } from "@/lib/utils/format";

interface CallInterfaceProps {
  status: "connecting" | "connected" | "ended";
  duration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onHangUp: () => void;
}

export function CallInterface({
  status,
  duration,
  isMuted,
  isSpeaker,
  onToggleMute,
  onToggleSpeaker,
  onHangUp,
}: CallInterfaceProps) {
  return (
    <View className="flex-1 items-center justify-center gap-8 bg-foreground px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/20">
        <Phone size={36} color={colors.primary} />
      </View>

      <View className="items-center gap-1">
        <Text className="text-xl font-semibold text-white">
          {status === "connecting"
            ? "Connecting..."
            : status === "ended"
              ? "Call Ended"
              : "Connected"}
        </Text>
        {status === "connected" ? (
          <Text className="text-lg text-white/60">
            {formatDuration(duration)}
          </Text>
        ) : null}
      </View>

      {status !== "ended" ? (
        <View className="flex-row gap-6">
          <Pressable
            onPress={onToggleMute}
            className={`h-14 w-14 items-center justify-center rounded-full ${
              isMuted ? "bg-white/20" : "bg-white/10"
            }`}
          >
            {isMuted ? (
              <MicOff size={24} color="#fff" />
            ) : (
              <Mic size={24} color="#fff" />
            )}
          </Pressable>

          <Pressable
            onPress={onToggleSpeaker}
            className={`h-14 w-14 items-center justify-center rounded-full ${
              isSpeaker ? "bg-white/20" : "bg-white/10"
            }`}
          >
            <Volume2 size={24} color="#fff" />
          </Pressable>

          <Pressable
            onPress={onHangUp}
            className="h-14 w-14 items-center justify-center rounded-full bg-destructive"
          >
            <PhoneOff size={24} color="#fff" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
