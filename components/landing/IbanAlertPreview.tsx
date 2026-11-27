/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Landmark } from "lucide-react";

/**
 * How BCM shows a changed IBAN, with the demo's data (Ferri & Associati,
 * invoice FA-2026-4T): the account the invoice asks for next to the verified
 * one, masked as the API masks them (IbanCheckDialog). The Home row itself is
 * already in the hero, so this tile shows the comparison instead. A picture:
 * hidden from screen readers, the tile's text says the same.
 */
export function IbanAlertPreview() {
  return (
    <div className="rounded-lg border border-border bg-background p-4" aria-hidden="true">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--status-red-bg)] text-[var(--status-red-fg)]">
          <Landmark className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-foreground">Fattura FA-2026-4T</p>
          <p className="text-sm text-muted-foreground">Ferri &amp; Associati S.r.l.</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">IBAN in fattura</dt>
          <dd className="font-mono font-semibold text-[var(--status-red-fg)]">IT...5519</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">IBAN verificato</dt>
          <dd className="font-mono font-semibold text-foreground">IT...4812</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">Esclusa dal file per il bonifico SEPA finché non verifichi.</p>
    </div>
  );
}
