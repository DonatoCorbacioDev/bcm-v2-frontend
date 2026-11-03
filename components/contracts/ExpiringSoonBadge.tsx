/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { Badge } from "@/components/ui/badge";
import { formatExpiresIn, getExpiringSoonDays } from "@/lib/statusConfig";
import type { Contract } from "@/types";

interface ExpiringSoonBadgeProps {
  contract: Pick<Contract, "status" | "daysUntilExpiry">;
  /** Show the days left in the label ("Scade tra 12 giorni") instead of "In scadenza". */
  showDays?: boolean;
  className?: string;
}

/** Amber badge next to "Attivo" for contracts ending within 30 days; renders nothing otherwise. */
export function ExpiringSoonBadge({ contract, showDays = false, className }: Readonly<ExpiringSoonBadgeProps>) {
  const days = getExpiringSoonDays(contract);
  if (days === null) return null;

  const expiresIn = formatExpiresIn(days);
  return (
    <Badge variant="warning" className={className} title={showDays ? undefined : expiresIn}>
      {showDays ? expiresIn : "In scadenza"}
    </Badge>
  );
}
