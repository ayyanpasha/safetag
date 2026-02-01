import { TextInput, View, Text, type TextInputProps } from "react-native";
import { forwardRef } from "react";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="gap-1.5">
        {label ? (
          <Text className="text-sm font-medium text-foreground">{label}</Text>
        ) : null}
        <TextInput
          ref={ref}
          className={`h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground ${error ? "border-destructive" : ""} ${className ?? ""}`}
          placeholderTextColor="#94A3B8"
          {...props}
        />
        {error ? (
          <Text className="text-sm text-destructive">{error}</Text>
        ) : null}
      </View>
    );
  }
);
