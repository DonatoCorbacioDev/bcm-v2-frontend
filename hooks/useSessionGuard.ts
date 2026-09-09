"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

/**
 * Reconciles the persisted `isAuthenticated` flag with reality on mount.
 *
 * `isAuthenticated`/`user` are persisted to localStorage, but `accessToken`
 * never is (see authStore.ts). A visitor whose session has since expired
 * (or expired refresh cookie) still carries a stale `isAuthenticated: true`
 * from a previous visit — without this check, every public page (landing
 * nav, hero, footer) would trust that flag forever and show the
 * "already logged in" UI to someone who isn't, with no way to reach the
 * guest CTAs short of the dashboard's own redirect-to-login clearing it.
 */
export function useSessionGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (!isAuthenticated || accessToken) return;
    let cancelled = false;
    api
      .post<{ token: string }>("/auth/refresh")
      .then((res) => {
        if (!cancelled) setAccessToken(res.data.token);
      })
      .catch(() => {
        if (!cancelled) clearAuth();
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken, setAccessToken, clearAuth]);
}
