/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

interface AddressParts {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
}

/**
 * The Italian postal order on one line: "Via Roma 12, 20121 Milano (MI)".
 * The country only when it isn't Italy. Empty string when nothing is known.
 */
export function formatAddress(parts: AddressParts): string {
  const town = [parts.postalCode, parts.city].filter(Boolean).join(" ")
    + (parts.province ? ` (${parts.province})` : "");
  const country = parts.country && parts.country.toUpperCase() !== "IT" ? parts.country.toUpperCase() : "";
  return [parts.address, town.trim(), country].filter(Boolean).join(", ");
}
