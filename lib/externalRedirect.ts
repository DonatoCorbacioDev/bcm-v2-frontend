/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * The only places the app ever sends the browser away to: Stripe's hosted
 * pages (billing portal, checkout). The URL comes from the backend, which gets
 * it from Stripe; checked here too (OWASP ASVS, allowlisted redirects), so a
 * tampered answer can't send a user to a look-alike page or run a
 * `javascript:` URL.
 */
const ALLOWED_ORIGINS = new Set(["https://billing.stripe.com", "https://checkout.stripe.com"]);

/** True for an absolute https URL on one of the allowed origins. */
export function isAllowedExternalUrl(url: string): boolean {
  try {
    return ALLOWED_ORIGINS.has(new URL(url).origin);
  } catch {
    return false;
  }
}

/**
 * Full-page navigation to another origin (e.g. Stripe Checkout), which
 * next/navigation's router can't do. A separate module so tests can mock it;
 * `navigate` is there for the same reason: jsdom doesn't allow replacing
 * window.location.assign. Refuses any URL outside the allowlist.
 */
export function redirectToExternal(
  url: string,
  navigate: (target: string) => void = (target) => window.location.assign(target),
): void {
  if (!isAllowedExternalUrl(url)) {
    throw new Error("Redirect refused: not an allowed external destination");
  }
  navigate(url);
}
