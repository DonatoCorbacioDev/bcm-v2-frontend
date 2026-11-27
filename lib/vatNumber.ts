/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * The shape of a VAT number (Partita IVA), the same rule as the backend's
 * VatNumbers: an Italian one, with or without "IT", has 11 digits and a
 * valid check digit (the Agenzia delle Entrate's Luhn scheme); a foreign one
 * is two letters and 2 to 13 letters or digits.
 */
export const VAT_NUMBER_INVALID =
  "Partita IVA non valida: una partita IVA italiana ha 11 cifre (es. IT01234567897), una estera inizia con la sigla del paese";

export function isValidVatNumber(raw: string): boolean {
  const vat = raw.replace(/\s+/g, "").toUpperCase();
  if (vat === "") return false;
  if (/^(IT)?\d+$/.test(vat)) {
    const digits = vat.startsWith("IT") ? vat.slice(2) : vat;
    if (digits.length !== 11 || /^0+$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      let d = Number(digits[i]);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return (10 - (sum % 10)) % 10 === Number(digits[10]);
  }
  return /^[A-Z]{2}[A-Z0-9]{2,13}$/.test(vat);
}
