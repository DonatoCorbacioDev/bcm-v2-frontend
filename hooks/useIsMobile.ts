/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useSyncExternalStore } from "react";

/** Below Tailwind's `md` breakpoint (768px): a phone, where wide tables don't fit. */
const MOBILE_QUERY = "(max-width: 767px)";

// React only subscribes in the browser, so window is always there; matchMedia
// may not be (jsdom in tests).
function subscribe(onChange: () => void): () => void {
  if (!window.matchMedia) return () => {};
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function isMobileNow(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * True on a phone-sized screen. False on the server and where matchMedia
 * doesn't exist (tests), so the desktop layout is the default.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, isMobileNow, () => false);
}
