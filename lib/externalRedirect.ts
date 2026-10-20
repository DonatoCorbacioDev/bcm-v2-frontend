/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * Full-page navigation to another origin (e.g. Stripe Checkout), which
 * next/navigation's router can't do. A separate module so tests can mock it:
 * jsdom doesn't allow replacing window.location.assign.
 */
export function redirectToExternal(url: string): void {
  window.location.assign(url);
}
