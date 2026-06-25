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
      const { token } = loginResponse.data;

      // setAuth() stores the access token in memory; the request interceptor
      // in lib/api.ts reads it from the store on every call, so there's no
      // need to set a default Authorization header here.
      const profileResponse = await api.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userProfile = profileResponse.data;

      setAuth(userProfile, token);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      const message =
        apiError.userMessage ||
        apiError.response?.data?.message ||
        "Accesso non riuscito. Riprova.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // The refresh_token cookie is sent automatically; the backend revokes
      // it and clears the cookie in its response.
      await api.post("/auth/logout");
    } catch {
      // proceed with clearing auth even if server-side revocation fails
    } finally {
      clearAuth();
    }
  };

  return { login, logout, isLoading, error, user, isAuthenticated };
};
