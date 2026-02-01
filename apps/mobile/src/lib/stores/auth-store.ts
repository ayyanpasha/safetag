import { create } from "zustand";
import type { UserProfile } from "@safetag/shared-types";
import { secureStorage } from "@/lib/utils/storage";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (
    accessToken: string,
    refreshToken: string
  ) => Promise<void>;
  setUser: (user: UserProfile) => void;
  login: (
    accessToken: string,
    refreshToken: string,
    user: UserProfile
  ) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: async (accessToken, refreshToken) => {
    await secureStorage.set("refreshToken", refreshToken);
    set({ accessToken });
  },

  setUser: (user) => set({ user }),

  login: async (accessToken, refreshToken, user) => {
    await secureStorage.set("refreshToken", refreshToken);
    set({ accessToken, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await secureStorage.remove("refreshToken");
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  restoreSession: async () => {
    const refreshToken = await secureStorage.get("refreshToken");
    if (!refreshToken) {
      set({ isLoading: false });
      return false;
    }
    // The root layout will attempt a token refresh via the API client
    // For now, mark as potentially authenticated so the refresh flow runs
    set({ isLoading: false });
    return true;
  },
}));
