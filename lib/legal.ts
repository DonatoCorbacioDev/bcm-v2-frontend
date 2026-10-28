/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * Version of the Terms of Service currently published at /termini. Sent with
 * every registration and stored by the backend with the acceptance timestamp,
 * so it's always provable which text a customer agreed to. Bump it (and the
 * backend's LegalTerms.CURRENT_VERSION, which must match) whenever the
 * Terms change in substance.
 */
export const TERMS_VERSION = "2026-10-28";

/** Human-readable date of TERMS_VERSION, shown on the page. */
export const TERMS_LAST_UPDATED = "28 ottobre 2026";

/**
 * Clauses that, under arts. 1341-1342 of the Italian Civil Code, are only
 * binding if the customer approves them specifically and separately — hence
 * the dedicated checkbox at registration. Numbers refer to sections of /termini.
 */
export const ONEROUS_CLAUSES =
  "5 (rinnovo automatico, assenza di rimborsi per periodi parziali, modifica dei prezzi), " +
  "9 (disponibilità del servizio), 11 (limitazione di responsabilità), " +
  "12 (recesso, sospensione e cancellazione dei dati), 14 (modifiche ai Termini), " +
  "16 (legge applicabile e foro esclusivo di Bari)";
