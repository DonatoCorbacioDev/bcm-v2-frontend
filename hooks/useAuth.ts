import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { LoginRequest } from "@/types";
import { AxiosError } from "axios";

interface BackendAuthResponse {
  token: string | null;
  mfaRequired: boolean;
  mfaToken: string | null;
}

export type LoginResult =
  | { success: true }
  | { success: false; mfaRequired: true; mfaToken: string }
  | { success: false; mfaRequired: false };

interface UserProfile {
  id: number;
  username: string;
  managerId: number;
  role: string;
  roleId: number;
  verified: boolean;
  createdAt: string;
  canApproveContracts: boolean;
}

interface ApiError extends AxiosError<{ message?: string }> {
  userMessage?: string;
}

export const useAuth = () => {
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeLogin = async (token: string) => {
    // setAuth() stores the access token in memory; the request interceptor
    // in lib/api.ts reads it from the store on every call, so there's no
    // need to set a default Authorization header here.
    const profileResponse = await api.get<UserProfile>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAuth(profileResponse.data, token);
  };

  const login = async (credentials: LoginRequest): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const loginResponse = await api.post<BackendAuthResponse>("/auth/login", credentials);
      const { token, mfaRequired, mfaToken } = loginResponse.data;

      if (mfaRequired && mfaToken) {
        return { success: false, mfaRequired: true, mfaToken };
      }

      await completeLogin(token as string);
      return { success: true };
    } catch (err) {
      const apiError = err as ApiError;
      const message =
        apiError.userMessage ||
        apiError.response?.data?.message ||
        "Accesso non riuscito. Riprova.";
      setError(message);
      return { success: false, mfaRequired: false };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (mfaToken: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<BackendAuthResponse>("/auth/2fa/verify", { mfaToken, code });
      await completeLogin(response.data.token as string);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      const message =
        apiError.userMessage ||
        apiError.response?.data?.message ||
        "Codice non valido. Riprova.";
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

  return { login, verifyTwoFactor, logout, isLoading, error, user, isAuthenticated };
};
