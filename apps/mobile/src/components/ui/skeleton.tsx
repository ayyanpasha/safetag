import { View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
}

export function Skeleton({
  width,
  height = 20,
  rounded,
  className,
  ...props
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ width: width as number, height }, animatedStyle]}
      className={`bg-muted ${rounded ? "rounded-full" : "rounded-xl"} ${className ?? ""}`}
      {...props}
    />
  );
}
