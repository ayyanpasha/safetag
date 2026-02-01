import { View, Text, Linking } from "react-native";
import { QrCode } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { colors } from "@/lib/constants/colors";

export function InvalidQR() {
  return (
    <View className="flex-1 items-center justify-center gap-6 px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <QrCode size={40} color={colors.destructive} />
      </View>
      <Text className="text-center text-xl font-bold text-foreground">
        Invalid QR Code
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        This QR code is not a valid SafeTag. Get your own SafeTag to protect
        your vehicle.
      </Text>
      <Button
        onPress={() => Linking.openURL("https://safetag.in")}
      >
        Get SafeTag
      </Button>
    </View>
  );
}
