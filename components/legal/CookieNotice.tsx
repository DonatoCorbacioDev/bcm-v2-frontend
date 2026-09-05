"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "bcm-cookie-notice-dismissed";

/**
 * BCM uses only a strictly-necessary session cookie (see /cookie-policy) —
 * there is nothing here to opt in or out of, so this is a one-time
 * informational notice, not a consent gate. Renders nothing until mounted
 * (avoids a hydration mismatch, since localStorage isn't available server-side)
 * and nothing at all once dismissed.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        setVisible(true);
      }
    } catch {
      // Storage unavailable (private mode, blocked) — skip the notice rather than error.
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Best effort only — the notice will simply reappear next visit.
    }
    setVisible(false);
  };

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
