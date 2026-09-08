/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { z } from "zod";

export const counterpartySchema = z.object({
  name: z
    .string({ message: "Il nome è obbligatorio" })
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(255, "Il nome non può superare i 255 caratteri")
    .trim(),

  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"], {
    message: "Il tipo deve essere Cliente, Fornitore o Entrambi",
  }),

  vatNumber: z.string().max(50, "La partita IVA non può superare i 50 caratteri").trim().optional().or(z.literal("")),
  taxCode: z.string().max(50, "Il codice fiscale non può superare i 50 caratteri").trim().optional().or(z.literal("")),
  address: z.string().max(500, "L'indirizzo non può superare i 500 caratteri").trim().optional().or(z.literal("")),
  contactName: z.string().max(255, "Il nome del referente non può superare i 255 caratteri").trim().optional().or(z.literal("")),
  contactEmail: z.email("Email non valida").trim().optional().or(z.literal("")),
  contactPhone: z.string().max(50, "Il telefono non può superare i 50 caratteri").trim().optional().or(z.literal("")),
  notes: z.string().max(2000, "Le note non possono superare i 2000 caratteri").trim().optional().or(z.literal("")),
});

export type CounterpartyFormData = z.infer<typeof counterpartySchema>;
