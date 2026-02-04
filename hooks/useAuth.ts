import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { LoginRequest } from "@/types";
import { AxiosError } from "axios";

interface BackendAuthResponse {
  token: string;
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

export const useAuth = () => {
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      // Login to get token
      const loginResponse = await api.post<BackendAuthResponse>("/auth/login", credentials);
      const { token } = loginResponse.data;

      // Set token in cookies temporarily
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user profile using /auth/me
      const profileResponse = await api.get<UserProfile>("/auth/me");
      const userProfile = profileResponse.data;

      // Save both token and user in store
      setAuth(userProfile, token);
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
  };

  return { login, logout, isLoading, error, user, isAuthenticated };
};