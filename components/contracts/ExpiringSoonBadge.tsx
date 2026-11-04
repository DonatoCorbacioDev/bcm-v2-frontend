/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { Badge } from "@/components/ui/badge";
import {
  formatExpiresIn,
  formatNoticeIn,
  getExpiringSoonDays,
  getNoticeDeadlineDays,
} from "@/lib/statusConfig";
import type { Contract } from "@/types";

interface ExpiringSoonBadgeProps {
  contract: Pick<Contract, "status" | "daysUntilExpiry" | "noticeDeadline" | "daysUntilNoticeDeadline">;
  /** Show the days left in the label ("Scade tra 12 giorni") instead of "In scadenza". */
  showDays?: boolean;
  className?: string;
}

/**
 * Amber badge next to "Attivo" when something must be done within 30 days.
 * For a tacitly renewing contract with a stated notice period that is the
 * last day to give notice, not the end date: by then it has renewed, so
 * the end date alone would warn too late (and, once the deadline has
 * passed, warn about an expiry that won't happen). Renders nothing otherwise.
 */
export function ExpiringSoonBadge({ contract, showDays = false, className }: Readonly<ExpiringSoonBadgeProps>) {
  if (contract.noticeDeadline) {
    const days = getNoticeDeadlineDays(contract);
    if (days === null) return null;
    const noticeIn = formatNoticeIn(days);
    return (
      <Badge variant="warning" className={className} title={showDays ? undefined : noticeIn}>
        {showDays ? noticeIn : "Disdetta in scadenza"}
      </Badge>
    );
  }

  const days = getExpiringSoonDays(contract);
  if (days === null) return null;

  const expiresIn = formatExpiresIn(days);
  return (
    <Badge variant="warning" className={className} title={showDays ? undefined : expiresIn}>
      {showDays ? expiresIn : "In scadenza"}
    </Badge>
  );
}
