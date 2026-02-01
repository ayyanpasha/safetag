import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
      <Text className="text-4xl font-bold text-foreground">404</Text>
      <Text className="text-base text-muted-foreground">Page not found</Text>
      <Button onPress={() => router.replace("/")}>Go Home</Button>
    </View>
  );
}
