import { useAuthStore } from "@/lib/stores/auth-store";
import { secureStorage } from "@/lib/utils/storage";
import { API_URL } from "@/lib/constants/config";
import type { ApiResponse } from "@safetag/shared-types";

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    const token = useAuthStore.getState().accessToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = await secureStorage.get("refreshToken");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data: ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }> = await res.json();
      if (data.success && data.data) {
        await useAuthStore
          .getState()
          .setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${path}`;
    let res = await fetch(url, { ...options, headers: this.getHeaders() });

    if (res.status === 401) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshToken().finally(
          () => (this.refreshPromise = null)
        );
      }
      const refreshed = await this.refreshPromise;
      if (refreshed) {
        res = await fetch(url, { ...options, headers: this.getHeaders() });
      } else {
        useAuthStore.getState().logout();
        return { success: false, error: "Session expired" };
      }
    }

    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  async upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${API_URL}${path}`;
    const token = useAuthStore.getState().accessToken;
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { method: "POST", headers, body: formData });
    return res.json();
  }
}

export const api = new ApiClient();
