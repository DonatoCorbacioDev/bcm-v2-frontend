/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * A calendar day with its Italian article, for sentences like "Disdici entro
 * l'11 novembre": "il 24 novembre", "l'8 novembre", "l'11 novembre", and the
 * ordinal for the first of the month, "il 1° novembre". Reads "2026-11-11" as
 * a calendar day, with no timezone shift.
 */
export function dayWithArticle(isoDate: string, withYear = false): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const text = new Date(y, m - 1, d).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
  if (d === 1) return `il ${text.replace(/^1 /, "1° ")}`;
  // Only 8 and 11 start with a vowel sound among day numbers ("otto", "undici").
  if (d === 8 || d === 11) return `l'${text}`;
  return `il ${text}`;
}
