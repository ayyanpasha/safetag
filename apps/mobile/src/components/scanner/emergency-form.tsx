import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EmergencyType } from "@safetag/shared-types";

interface EmergencyFormProps {
  onSubmit: (data: {
    phone: string;
    otp: string;
    emergencyType: EmergencyType;
  }) => void;
  onSendOtp: (phone: string) => void;
  loading?: boolean;
  otpSent?: boolean;
}

const emergencyTypes: { value: EmergencyType; label: string }[] = [
  { value: "ACCIDENT", label: "Accident" },
  { value: "CAR_CRASH", label: "Car Crash" },
  { value: "THEFT", label: "Theft" },
  { value: "VANDALISM", label: "Vandalism" },
  { value: "FIRE", label: "Fire" },
  { value: "OTHER", label: "Other" },
];

export function EmergencyForm({
  onSubmit,
  onSendOtp,
  loading,
  otpSent,
}: EmergencyFormProps) {
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

  return (
    <View className="gap-4">
      <Text className="text-lg font-semibold text-foreground">
        Report Emergency
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {emergencyTypes.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setSelectedType(t.value)}
            className={`rounded-full border px-4 py-2 ${
              selectedType === t.value
                ? "border-destructive bg-red-50"
                : "border-border bg-card"
            }`}
          >
            <Text
              className={`text-sm ${
                selectedType === t.value
                  ? "font-semibold text-destructive"
                  : "text-foreground"
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+919876543210"
      />

      {!otpSent ? (
        <Button variant="outline" onPress={() => onSendOtp(phone)}>
          Send OTP
        </Button>
      ) : (
        <>
          <Input
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
          />
          <Button
            variant="destructive"
            onPress={() => {
              if (selectedType) onSubmit({ phone, otp, emergencyType: selectedType });
            }}
            loading={loading}
            disabled={!selectedType || otp.length !== 6}
          >
            Submit Report
          </Button>
        </>
      )}
    </View>
  );
}
