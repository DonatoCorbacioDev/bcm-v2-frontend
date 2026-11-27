"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { usePathname } from "next/navigation";
import { Calculator, MessageSquare } from "lucide-react";

// The same public address as the privacy and cookie pages.
const FEEDBACK_EMAIL = "donatocorbacio92@gmail.com";

/** The mail the link opens: the page it was written from, and a question to start from. */
export function feedbackHref(pathname: string): string {
  const subject = "Parere su BCM";
  const body = `Pagina: ${pathname}\n\nCosa non ti è chiaro, o cosa miglioreresti?\n\n`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * "Dai un parere": opens the user's own mail app with the page already
 * written in, so whoever is stuck can say so in the moment. A plain mailto:
 * nothing is sent to a third-party service, and nothing leaves until the
 * user presses send.
 */
export function FeedbackLink({ collapsed = false, onClick }: { readonly collapsed?: boolean; readonly onClick?: () => void }) {
  const pathname = usePathname() ?? "/";
  return (
    <a
      href={feedbackHref(pathname)}
      onClick={onClick}
      aria-label={collapsed ? "Dai un parere su BCM" : undefined}
      title={collapsed ? "Dai un parere su BCM" : undefined}
      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? "justify-center" : ""}`}
    >
      <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed && "Dai un parere"}
    </a>
  );
}

/**
 * The public notice calculator, for a quick check before a contract is in
 * BCM (inside BCM every contract is calculated already). A new tab, so the
 * page one is working on stays where it is.
 */
export function CalculatorLink({ collapsed = false, onClick }: { readonly collapsed?: boolean; readonly onClick?: () => void }) {
  return (
    <a
      href="/calcolo-disdetta"
      target="_blank"
      rel="noopener"
      onClick={onClick}
      aria-label={collapsed ? "Calcolo disdetta (si apre in una nuova scheda)" : undefined}
      title={collapsed ? "Calcolo disdetta" : undefined}
      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? "justify-center" : ""}`}
    >
      <Calculator className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed && (
        <>
          Calcolo disdetta<span className="sr-only"> (si apre in una nuova scheda)</span>
        </>
      )}
    </a>
  );
}
