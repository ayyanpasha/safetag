import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings,
  CreditCard,
  Crown,
  Receipt,
  Users,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { SubscriptionBadge } from "@/components/dashboard/subscription-badge";
import { colors } from "@/lib/constants/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: subscription } = useSubscription();

  const menuItems = [
    { icon: Settings, label: "Settings", href: "/(tabs)/(profile)/settings" as const },
    { icon: Crown, label: "Subscription", href: "/(tabs)/(profile)/subscription" as const },
    { icon: Receipt, label: "Billing", href: "/(tabs)/(profile)/billing" as const },
    { icon: CreditCard, label: "Upgrade Plan", href: "/(tabs)/(profile)/upgrade" as const },
    { icon: Users, label: "Affiliate", href: "/(tabs)/(profile)/affiliate" as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Header title="Profile" />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Card className="gap-2 mt-2">
          <Text className="text-lg font-semibold text-foreground">
            {user?.name ?? "SafeTag User"}
          </Text>
          <Text className="text-sm text-muted-foreground">{user?.phone}</Text>
          {user?.email ? (
            <Text className="text-sm text-muted-foreground">{user.email}</Text>
          ) : null}
          <SubscriptionBadge subscription={subscription ?? null} />
        </Card>

        <View className="mt-4 gap-1">
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href)}
              className="flex-row items-center gap-3 rounded-xl px-4 py-3 active:bg-muted"
            >
              <item.icon size={20} color={colors.foreground} />
              <Text className="flex-1 text-base text-foreground">
                {item.label}
              </Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
          className="mt-6 flex-row items-center gap-3 rounded-xl px-4 py-3 active:bg-red-50"
        >
          <LogOut size={20} color={colors.destructive} />
          <Text className="text-base font-medium text-destructive">
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
