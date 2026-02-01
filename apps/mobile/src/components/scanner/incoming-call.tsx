import { View, Text, Pressable } from "react-native";
import { Phone, PhoneOff } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";

interface IncomingCallProps {
  callerInfo: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallScreen({
  callerInfo,
  onAccept,
  onDecline,
}: IncomingCallProps) {
  return (
    <View className="flex-1 items-center justify-center gap-10 bg-foreground px-8">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/20">
        <Phone size={40} color={colors.primary} />
      </View>

      <View className="items-center gap-2">
        <Text className="text-2xl font-bold text-white">Incoming Call</Text>
        <Text className="text-base text-white/60">{callerInfo}</Text>
      </View>

      <View className="flex-row gap-12">
        <View className="items-center gap-2">
          <Pressable
            onPress={onDecline}
            className="h-16 w-16 items-center justify-center rounded-full bg-destructive"
          >
            <PhoneOff size={28} color="#fff" />
          </Pressable>
          <Text className="text-sm text-white/60">Decline</Text>
        </View>

        <View className="items-center gap-2">
          <Pressable
            onPress={onAccept}
            className="h-16 w-16 items-center justify-center rounded-full bg-green-500"
          >
            <Phone size={28} color="#fff" />
          </Pressable>
          <Text className="text-sm text-white/60">Accept</Text>
        </View>
      </View>
    </View>
  );
}
