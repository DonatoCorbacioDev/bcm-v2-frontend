"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "bcm-cookie-notice-dismissed";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage unavailable (private mode, blocked) — treat as dismissed rather
    // than show a notice whose "Capito" button can't actually persist anything.
    return true;
  }
}

// Never show the notice on the server-rendered/first-hydration pass (no
// localStorage there) — same "render nothing until we truly know" approach
// as useDarkMode's getServerSnapshot. It then updates to the real value on
// the client via useSyncExternalStore, no setState-in-effect needed.
function getServerSnapshot(): boolean {
  return true;
}

function dismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Best effort only — the notice will simply reappear next visit.
  }
  listeners.forEach((callback) => callback());
}

/**
 * BCM uses only a strictly-necessary session cookie (see /cookie-policy) —
 * there is nothing here to opt in or out of, so this is a one-time
 * informational notice, not a consent gate.
 */
export function CookieNotice() {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, getServerSnapshot);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Informativa sui cookie"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md px-4 py-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        <p className="text-sm text-muted-foreground flex-1">
          Usiamo solo un cookie tecnico essenziale per mantenere la sessione — nessun cookie di
          profilazione o di terze parti. Dettagli nella{" "}
          <Link
            href="/cookie-policy"
            className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary dark:text-[var(--accent-foreground)] dark:decoration-[var(--accent-foreground)]/40 dark:hover:decoration-[var(--accent-foreground)]"
          >
            Cookie Policy
          </Link>.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Capito
        </button>
      </div>
    </div>
  );
}
