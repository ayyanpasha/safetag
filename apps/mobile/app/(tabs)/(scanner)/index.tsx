import { useRouter } from "expo-router";
import { QRCamera } from "@/components/scanner/qr-camera";

export default function ScannerTabScreen() {
  const router = useRouter();

  const handleScan = (shortCode: string) => {
    router.push(`/scan/${shortCode}`);
  };

  return <QRCamera onScan={handleScan} />;
}
