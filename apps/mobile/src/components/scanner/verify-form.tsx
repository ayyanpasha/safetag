import { useState } from "react";
import { View, Text } from "react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VerifyFormProps {
  maskedNumber?: string;
  onVerify: (vehicleNumber: string) => void;
  loading?: boolean;
}

export function VerifyForm({ maskedNumber, onVerify, loading }: VerifyFormProps) {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const cleaned = vehicleNumber.toUpperCase().replace(/\s/g, "");
    if (cleaned.length < 4) {
      setError("Enter a valid vehicle number");
      return;
    }
    setError("");
    onVerify(cleaned);
  };

  return (
    <View className="gap-4">
      <Text className="text-center text-lg font-semibold text-foreground">
        Verify Vehicle
      </Text>
      {maskedNumber ? (
        <Text className="text-center text-sm text-muted-foreground">
          Vehicle: {maskedNumber}
        </Text>
      ) : null}
      <Input
        label="Vehicle Number"
        placeholder="e.g. KA01AB1234"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        autoCapitalize="characters"
        error={error}
      />
      <Button onPress={handleSubmit} loading={loading}>
        Verify
      </Button>
    </View>
  );
}
