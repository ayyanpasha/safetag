import { useState } from "react";
import { View } from "react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VehicleFormProps {
  onSubmit: (data: {
    vehicleNumber: string;
    make?: string;
    model?: string;
    color?: string;
  }) => void;
  loading?: boolean;
}

export function VehicleForm({ onSubmit, loading }: VehicleFormProps) {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const cleaned = vehicleNumber.toUpperCase().replace(/\s/g, "");
    if (cleaned.length < 4) {
      setError("Enter a valid vehicle number");
      return;
    }
    setError("");
    onSubmit({
      vehicleNumber: cleaned,
      make: make || undefined,
      model: model || undefined,
      color: color || undefined,
    });
  };

  return (
    <View className="gap-4">
      <Input
        label="Vehicle Number *"
        placeholder="e.g. KA01AB1234"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        autoCapitalize="characters"
        error={error}
      />
      <Input
        label="Make"
        placeholder="e.g. Toyota"
        value={make}
        onChangeText={setMake}
      />
      <Input
        label="Model"
        placeholder="e.g. Innova"
        value={model}
        onChangeText={setModel}
      />
      <Input
        label="Color"
        placeholder="e.g. White"
        value={color}
        onChangeText={setColor}
      />
      <Button onPress={handleSubmit} loading={loading}>
        Add Vehicle
      </Button>
    </View>
  );
}
