import { View, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Icon size={48} color={colors.mutedForeground} />
      <Text className="mt-4 text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      <Text className="mt-1 text-center text-sm text-muted-foreground">
        {description}
      </Text>
      {action ? <View className="mt-6">{action}</View> : null}
    </View>
  );
}
