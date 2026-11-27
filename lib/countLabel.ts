/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * How many rows a list shows, in words: "1 controparte", "12 contratti", and
 * "3 di 12 contratti" only while a search or filter hides some.
 */
export function countLabel(shown: number, total: number, one: string, many: string): string {
  const noun = (n: number) => (n === 1 ? one : many);
  return shown === total ? `${total} ${noun(total)}` : `${shown} di ${total} ${noun(total)}`;
}
