import { ActivityIndicator, View } from "react-native";
import { colors } from "@/lib/constants/colors";

interface SpinnerProps {
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
}

export function Spinner({
  size = "large",
  color = colors.primary,
  fullScreen,
}: SpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={color} />;
}
