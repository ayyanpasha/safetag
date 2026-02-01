import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { sendOtp, verifyOtp, getProfile } from "@/lib/api/auth";

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => sendOtp(phone),
  });
}

export function useVerifyOtp() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      verifyOtp(phone, otp),
    onSuccess: async (res) => {
      if (res.success && res.data) {
        await login(
          res.data.accessToken,
          res.data.refreshToken,
          res.data.user
        );
      }
    },
  });
}

export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: () => getProfile(),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setUser(res.data);
      }
    },
  });
}
