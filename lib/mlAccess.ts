/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { isAxiosError } from "axios";

/**
 * True when a failed ML-endpoint request (forecast/risk-scores/anomalies/
 * agent-insights) was rejected because the organization's subscription tier
 * doesn't include ML features (backend's `TierLimitService.requireMlAccess`,
 * 403), as opposed to a genuine connectivity/service-down failure. Dashboard
 * widgets use this to show an upgrade message instead of "check if the
 * backend is running" — the two are not the same problem for the user.
 */
export function isMlTierForbidden(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403;
}
