/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { create } from "zustand";

/**
 * The password again before an operation that asks for it (the backend
 * answers 428: exporting the organization, changing an account's email,
 * setting another user's password, turning 2FA off; OWASP ASVS 7.5). `requestReauth()` opens
 * ReauthDialog and resolves with the token the backend issued, which lib/api.ts
 * sends back in X-Reauth-Token. The token is kept in memory only, for the five
 * minutes it is valid, so a few operations in a row ask once.
 */

/** A little under the backend's five minutes, so a token is never sent just as it expires. */
const TOKEN_LIFETIME_MS = 4.5 * 60_000;

interface ReauthState {
  open: boolean;
  token: string | null;
  expiresAt: number;
  resolve: ((token: string) => void) | null;
  reject: ((reason: Error) => void) | null;
  /** Called by ReauthDialog with the token from POST /auth/reauth. */
  confirmed: (token: string) => void;
  /** Called by ReauthDialog when the user closes it. */
  cancelled: () => void;
}

export const useReauthStore = create<ReauthState>((set, get) => ({
  open: false,
  token: null,
  expiresAt: 0,
  resolve: null,
  reject: null,
  confirmed: (token) => {
    get().resolve?.(token);
    set({ open: false, token, expiresAt: Date.now() + TOKEN_LIFETIME_MS, resolve: null, reject: null });
  },
  cancelled: () => {
    get().reject?.(new Error("Operazione annullata"));
    set({ open: false, resolve: null, reject: null });
  },
}));

/** The current token if still fresh, otherwise asks for the password and waits for it. */
export function requestReauth(): Promise<string> {
  const state = useReauthStore.getState();
  if (state.token && Date.now() < state.expiresAt) {
    return Promise.resolve(state.token);
  }
  // Already asking (two requests needed it at once): wait for the same answer.
  if (state.open && state.resolve) {
    return new Promise((resolve, reject) => {
      const previousResolve = state.resolve!;
      const previousReject = state.reject!;
      useReauthStore.setState({
        resolve: (token) => { previousResolve(token); resolve(token); },
        reject: (reason) => { previousReject(reason); reject(reason); },
      });
    });
  }
  return new Promise((resolve, reject) => {
    useReauthStore.setState({ open: true, resolve, reject });
  });
}

/** Forgets the token (logout, or the backend refused it). */
export function clearReauth(): void {
  useReauthStore.setState({ token: null, expiresAt: 0 });
}
