import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { useIncomingCall } from "@/lib/hooks/use-incoming-call";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/lib/constants/config";
import "../../global.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      retry: 3,
    },
  },
});

function AppInner() {
  useNotifications();
  useIncomingCall();

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scan"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="call"
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
