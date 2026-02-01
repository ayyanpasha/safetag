import { Tabs } from "expo-router";
import { Home, Car, ScanLine, ShieldAlert, User } from "lucide-react-native";
import { colors } from "@/lib/constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(vehicles)"
        options={{
          title: "Vehicles",
          tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(scanner)"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }) => (
            <ScanLine size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(incidents)"
        options={{
          title: "Incidents",
          tabBarIcon: ({ color, size }) => (
            <ShieldAlert size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
