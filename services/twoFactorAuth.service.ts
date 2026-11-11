/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";

export interface TotpSetup {
  secret: string;
  otpAuthUri: string;
}

export interface EnrollmentResult {
  token: string;
  recoveryCodes: string[];
}

export const twoFactorAuthService = {
  getStatus: async (): Promise<boolean> => {
    const res = await api.get<{ enabled: boolean }>("/users/me/2fa/status");
    return res.data.enabled;
  },

  setup: async (): Promise<TotpSetup> => {
    const res = await api.post<TotpSetup>("/users/me/2fa/setup");
    return res.data;
  },

  confirm: async (code: string): Promise<string[]> => {
    const res = await api.post<{ recoveryCodes: string[] }>("/users/me/2fa/confirm", { code });
    return res.data.recoveryCodes;
  },

  disable: async (code: string): Promise<void> => {
    await api.post("/users/me/2fa/disable", { code });
  },

  /** Required setup before the first session: authorized by the setup token from login. */
  enrollSetup: async (setupToken: string): Promise<TotpSetup> => {
    const res = await api.post<TotpSetup>("/auth/2fa/enroll/setup", { setupToken });
    return res.data;
  },

  /** Turns 2FA on and opens the session (the refresh cookie comes with the response). */
  enrollConfirm: async (setupToken: string, code: string): Promise<EnrollmentResult> => {
    const res = await api.post<EnrollmentResult>("/auth/2fa/enroll/confirm", { setupToken, code });
    return res.data;
  },
};
