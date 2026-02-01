import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Spinner } from "@/components/ui/spinner";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <Spinner fullScreen />;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
