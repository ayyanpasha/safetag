import { View, Text } from "react-native";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
  children: React.ReactNode;
}

const variants = {
  default: "bg-primary/10",
  success: "bg-green-100",
  warning: "bg-yellow-100",
  destructive: "bg-red-100",
  outline: "border border-border bg-transparent",
} as const;

const textVariants = {
  default: "text-primary",
  success: "text-green-700",
  warning: "text-yellow-700",
  destructive: "text-red-700",
  outline: "text-foreground",
} as const;

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${variants[variant]}`}>
      <Text className={`text-xs font-medium ${textVariants[variant]}`}>
        {children}
      </Text>
    </View>
  );
}
