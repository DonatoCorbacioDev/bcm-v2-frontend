"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { twoFactorAuthService } from "@/services/twoFactorAuth.service";

interface TwoFactorReminderProps {
  readonly isAdmin: boolean;
}

/**
 * Asks an admin without two-factor authentication to turn it on. It is a
 * reminder, not a requirement (see the backend's docs/SECURITY.md): an admin
 * account reaches every contract and user of the organization. Shares the
 * profile card's query, so it disappears as soon as 2FA is confirmed there.
 */
export function TwoFactorReminder({ isAdmin }: TwoFactorReminderProps) {
  const { data: enabled } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: twoFactorAuthService.getStatus,
    enabled: isAdmin,
  });

  // Only a confirmed "off": nothing while loading or if the check fails.
  if (!isAdmin || enabled !== false) return null;

  return (
    <section
      aria-label="Autenticazione a due fattori"
      className="flex items-start gap-3 rounded-lg border border-[var(--status-amber-fg)]/30 bg-[var(--status-amber-fg)]/5 p-4"
    >
      <ShieldAlert className="h-5 w-5 text-[var(--status-amber-fg)] shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 space-y-3">
        <p className="text-sm text-foreground">
          Il tuo account amministratore accede a tutti i contratti e gli utenti dell&apos;organizzazione.
          Attiva l&apos;autenticazione a due fattori per proteggerlo anche se la password venisse scoperta.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/profile">Attiva la 2FA</Link>
        </Button>
      </div>
    </section>
  );
}
