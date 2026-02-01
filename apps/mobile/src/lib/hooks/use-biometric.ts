import { useState, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { storage } from "@/lib/utils/storage";

export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const checkAvailability = useCallback(async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsAvailable(compatible && enrolled);

    const enabled = await storage.get("biometric_enabled");
    setIsEnabled(enabled === "true");
  }, []);

  const authenticate = useCallback(async (reason?: string) => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason ?? "Authenticate to continue",
      fallbackLabel: "Use OTP",
      cancelLabel: "Cancel",
    });
    return result.success;
  }, []);

  const enable = useCallback(async () => {
    const success = await authenticate("Enable biometric login");
    if (success) {
      await storage.set("biometric_enabled", "true");
      setIsEnabled(true);
    }
    return success;
  }, [authenticate]);

  const disable = useCallback(async () => {
    await storage.remove("biometric_enabled");
    setIsEnabled(false);
  }, []);

  return { isAvailable, isEnabled, checkAvailability, authenticate, enable, disable };
}
