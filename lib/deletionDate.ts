/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/** "3 dicembre 2026" for a scheduled deletion (backend local date-time). */
export function formatDeletionDate(scheduledFor: string): string {
  return new Date(scheduledFor).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
