import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button } from "@/components/ui/button";
import { QR_URL_PATTERN, QR_HTTP_PATTERN } from "@/lib/constants/config";

interface QRCameraProps {
  onScan: (shortCode: string) => void;
}

export function QRCamera({ onScan }: QRCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text className="text-center text-base text-foreground">
          Camera permission is needed to scan QR codes
        </Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    const match = data.match(QR_URL_PATTERN) || data.match(QR_HTTP_PATTERN);
    if (match) {
      setScanned(true);
      onScan(match[1]);
    }
  };

  return (
    <View className="flex-1">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View className="flex-1 items-center justify-center">
        <View className="h-64 w-64 rounded-3xl border-2 border-white/50" />
        <Text className="mt-4 text-sm text-white/80">
          Point camera at a SafeTag QR code
        </Text>
      </View>
      {scanned ? (
        <View className="absolute bottom-8 left-4 right-4">
          <Button onPress={() => setScanned(false)}>Scan Again</Button>
        </View>
      ) : null}
    </View>
  );
}
