/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * The public demo account. Public on purpose: anyone may open the demo with
 * one click (/demo), and the login page offers it too. Seeded nightly by
 * bcm-v2-docker ops/demo/demo-reset.sh: MANAGER role, no 2FA, sample data of
 * an invented company, reset every night.
 */
export const DEMO_CREDENTIALS = { username: "demo", password: "BcmDemo#2026" } as const;

export function isDemoUser(username: string | null | undefined): boolean {
  return username === DEMO_CREDENTIALS.username;
}
