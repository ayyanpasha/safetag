import { useRef, useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export function OtpInput({ length = 6, onComplete }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text;
    setValues(newValues);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValues.every((v) => v.length === 1)) {
      onComplete(newValues.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row gap-3 justify-center">
      {values.map((value, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          value={value}
          onChangeText={(text) => handleChange(text.slice(-1), index)}
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(nativeEvent.key, index)
          }
          keyboardType="number-pad"
          maxLength={1}
          className="h-14 w-11 rounded-xl border border-border bg-card text-center text-xl font-semibold text-foreground"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
