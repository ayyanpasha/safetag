import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Spinner } from "@/components/ui/spinner";
import { InvalidQR } from "@/components/scanner/invalid-qr";
import { validateQR } from "@/lib/api/scanner";
import { useScannerStore } from "@/lib/stores/scanner-store";

export default function ScanValidateScreen() {
  const { shortCode } = useLocalSearchParams<{ shortCode: string }>();
  const router = useRouter();
  const setShortCode = useScannerStore((s) => s.setShortCode);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [maskedNumber, setMaskedNumber] = useState<string>();

  useEffect(() => {
    validateQR(shortCode).then((res) => {
      if (res.success && res.data?.valid) {
        setIsValid(true);
        setMaskedNumber(res.data.maskedNumber);
        setShortCode(shortCode);
        router.replace(`/scan/${shortCode}/verify`);
      } else {
        setIsValid(false);
      }
    });
  }, [shortCode]);

  if (isValid === null) return <Spinner fullScreen />;
  if (!isValid) return <InvalidQR />;

  return <Spinner fullScreen />;
}
