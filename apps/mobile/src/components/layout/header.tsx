import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, showBack, right }: HeaderProps) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
      <View className="w-10">
        {showBack ? (
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ChevronLeft size={24} color={colors.foreground} />
          </Pressable>
        ) : null}
      </View>
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      <View className="w-10 items-end">{right}</View>
    </View>
  );
}
