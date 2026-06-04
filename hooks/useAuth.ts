import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { LoginRequest } from "@/types";
import { AxiosError } from "axios";

interface BackendAuthResponse {
  token: string;
  refreshToken: string;
}

interface UserProfile {
  id: number;
  username: string;
  managerId: number;
  role: string;
  roleId: number;
  verified: boolean;
  createdAt: string;
}

interface ApiError extends AxiosError<{ message?: string }> {
  userMessage?: string;
}

export const useAuth = () => {
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const loginResponse = await api.post<BackendAuthResponse>("/auth/login", credentials);
      const { token, refreshToken } = loginResponse.data;

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const profileResponse = await api.get<UserProfile>("/auth/me");
      const userProfile = profileResponse.data;

      setAuth(userProfile, token, refreshToken);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      const message =
        apiError.userMessage ||
        apiError.response?.data?.message ||
        "Login failed. Please try again.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("auth_refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // proceed with clearing auth even if server-side revocation fails
    } finally {
      clearAuth();
    }
  };

  return { login, logout, isLoading, error, user, isAuthenticated };
};
