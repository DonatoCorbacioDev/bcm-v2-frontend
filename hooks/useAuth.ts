import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { LoginRequest, AuthResponse } from "@/types";
import { AxiosError } from "axios";

export const useAuth = () => {
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      const { token, user } = response.data;
      setAuth(user, token);
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
