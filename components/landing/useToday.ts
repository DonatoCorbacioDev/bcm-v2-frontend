/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useSyncExternalStore } from "react";

/** YYYY-MM-DD for `base` plus `days`, in the visitor's own time zone. */
export function isoInDays(base: Date, days: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const subscribeNever = () => () => {};

/**
 * Today in the browser, or null while the page is rendered on the server.
 * The landing's examples count their dates from today, so they never show a
 * deadline already past; before the browser fills them in, they read
 * "tra 20 giorni" without the date, which is still true.
 */
export function useToday(): Date | null {
  const iso = useSyncExternalStore(subscribeNever, () => isoInDays(new Date(), 0), () => null);
  return iso ? new Date(`${iso}T00:00:00`) : null;
}
