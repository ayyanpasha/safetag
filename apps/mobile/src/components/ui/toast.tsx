import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

interface ToastProps {
  message: string;
  variant?: "default" | "success" | "error";
  onDismiss: () => void;
  duration?: number;
}

const variants = {
  default: "bg-foreground",
  success: "bg-green-600",
  error: "bg-destructive",
} as const;

export function Toast({
  message,
  variant = "default",
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    translateY.value = withDelay(
      duration,
      withTiming(-100, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={`absolute left-4 right-4 top-16 z-50 rounded-xl px-4 py-3 ${variants[variant]}`}
    >
      <Text className="text-center text-sm font-medium text-white">
        {message}
      </Text>
    </Animated.View>
  );
}
