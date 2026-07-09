import api from "@/lib/api";

export interface TotpSetup {
  secret: string;
  otpAuthUri: string;
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
};
