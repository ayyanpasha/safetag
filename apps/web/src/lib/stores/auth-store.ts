import { create } from "zustand";
import type { UserProfile } from "@safetag/shared-types";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile) => void;
  login: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setTokens: (accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("refreshToken", refreshToken);
    }
    set({ accessToken });
  },

  setUser: (user) => set({ user }),

  login: (accessToken, refreshToken, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("refreshToken", refreshToken);
    }
    set({ accessToken, user, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("refreshToken");
    }
    set({ accessToken: null, user: null, isAuthenticated: false });
  },
}));
