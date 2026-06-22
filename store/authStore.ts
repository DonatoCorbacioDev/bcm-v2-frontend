import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
  getToken: () => string | null;
}

// The access token is intentionally kept in memory only (never persisted to
// localStorage/sessionStorage): an XSS payload that can run JS can also read
// any storage API, so the only way to keep the token out of its reach is to
// never write it to disk. It is lost on full page reload by design — the
// dashboard layout silently re-fetches it via the HttpOnly refresh_token
// cookie (see app/(dashboard)/layout.tsx) before rendering protected content.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      setAuth: (user, token) => {
        set({ user, isAuthenticated: true, accessToken: token });
      },
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => {
        set({ user: null, isAuthenticated: false, accessToken: null });
      },
      getToken: () => get().accessToken,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
