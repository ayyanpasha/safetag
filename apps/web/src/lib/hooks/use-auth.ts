"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getProfile } from "@/lib/api/auth";

export function useAuth({ required = false } = {}) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && required) {
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;
      if (!refreshToken) {
        router.replace("/auth/login");
        return;
      }
      // Try to restore session
      getProfile().then((res) => {
        if (res.success && res.data) {
          useAuthStore.getState().setUser(res.data);
        } else {
          logout();
          router.replace("/auth/login");
        }
      });
    }
  }, [isAuthenticated, required, router, logout]);

  return { user, isAuthenticated, logout };
}
