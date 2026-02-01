import { View, Text, Share } from "react-native";
import { Image } from "expo-image";
import { Button } from "@/components/ui/button";

interface QRDisplayProps {
  qrCode: string;
  shortCode: string;
  vehicleNumber: string;
}

export function QRDisplay({ qrCode, shortCode, vehicleNumber }: QRDisplayProps) {
  const handleShare = async () => {
    await Share.share({
      message: `SafeTag QR for ${vehicleNumber}: safetag://s/${shortCode}`,
    });
  };

  return (
    <View className="items-center gap-4">
      <Image
        source={{ uri: qrCode }}
        style={{ width: 200, height: 200 }}
        contentFit="contain"
      />
      <Text className="text-sm text-muted-foreground">{shortCode}</Text>
      <Button variant="outline" onPress={handleShare}>
        Share QR Code
      </Button>
    </View>
  );
}
