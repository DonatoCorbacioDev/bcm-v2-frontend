/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { z } from "zod";

import { computeNoticeDeadline } from "@/lib/statusConfig";

/**
 * Zod validation schema for contracts
 * Used for both CREATE and UPDATE operations
 */
export const contractSchema = z.object({
  // Counterparty (customer/supplier) ID (foreign key)
  counterpartyId: z
    .number({ message: "La controparte è obbligatoria" })
    .int("La controparte deve essere un numero intero")
    .positive("La controparte deve essere un numero positivo"),

  // Contract number (format: C001, C002, etc.)
  contractNumber: z
    .string({ message: "Il numero di contratto è obbligatorio" })
    .min(1, "Il numero di contratto è obbligatorio")
    .max(50, "Il numero di contratto non può superare i 50 caratteri")
    .regex(
      /^[A-Z0-9-]+$/,
      "Il numero di contratto può contenere solo lettere maiuscole, numeri e trattini"
    )
    .trim(),

  // WBS code (Work Breakdown Structure), optional: most contracts have none.
  // An empty input stays "" here; ContractForm sends it as "not set".
  wbsCode: z
    .string()
    .trim()
    .max(50, "Il codice WBS non può superare i 50 caratteri")
    .optional(),

  // What the contract is about ("Oggetto" in the UI; projectName in the API,
  // where it was born as a project name). Optional, but not a stray letter.
  projectName: z
    .string()
    .trim()
    .max(200, "L'oggetto non può superare i 200 caratteri")
    .refine((value) => value === "" || value.length >= 3, "L'oggetto deve contenere almeno 3 caratteri")
    .optional(),

  // Start date (ISO format: YYYY-MM-DD)
  startDate: z
    .string({ message: "La data di inizio è obbligatoria" })
    .min(1, "La data di inizio è obbligatoria")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La data di inizio deve essere nel formato AAAA-MM-GG"
    ),

  // End date (ISO format: YYYY-MM-DD)
  endDate: z
    .string({ message: "La data di fine è obbligatoria" })
    .min(1, "La data di fine è obbligatoria")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La data di fine deve essere nel formato AAAA-MM-GG"
    ),

  // Contract status
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "DRAFT"], {
    message: "Lo stato deve essere ACTIVE, EXPIRED, CANCELLED o DRAFT",
  }),

  // Business area ID (foreign key)
  areaId: z
    .number({ message: "L'area di business è obbligatoria" })
    .int("L'area di business deve essere un numero intero")
    .positive("L'area di business deve essere un numero positivo"),

  // Manager ID (foreign key)
  managerId: z
    .number({ message: "Il responsabile è obbligatorio" })
    .int("Il responsabile deve essere un numero intero")
    .positive("Il responsabile deve essere un numero positivo"),

  // Optional financial terms: when all three are set, the backend
  // auto-generates this contract's financial values instead of requiring
  // them to be entered one row at a time (see the .refine below).
  financialTypeId: z
    .number()
    .int("Il tipo finanziario deve essere un numero intero")
    .positive("Il tipo finanziario deve essere un numero positivo")
    .nullish(),

  // Note: ContractForm reads this field with a custom `setValueAs` (not
  // `valueAsNumber`) specifically so an empty input becomes `undefined`
  // here, not NaN — see that component for why.
  annualValue: z
    .number()
    .positive("Il valore annuo deve essere un numero positivo")
    .nullish(),

  billingFrequency: z
    .enum(["MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"], {
      message: "La frequenza di fatturazione non è valida",
    })
    .nullish(),

  // Tacit renewal terms, optional: the user states them, BCM never infers
  // them. Read with the same setValueAs as annualValue (empty -> undefined).
  autoRenew: z.boolean().nullish(),
  noticeDays: z
    .number()
    .int("Il preavviso deve essere un numero intero di giorni")
    .min(0, "Il preavviso non può essere negativo")
    .max(3650, "Il preavviso non può superare i 10 anni")
    .nullish(),
  renewalMonths: z
    .number()
    .int("La durata del rinnovo deve essere un numero intero di mesi")
    .min(1, "La durata del rinnovo deve essere di almeno 1 mese")
    .max(120, "La durata del rinnovo non può superare i 120 mesi")
    .nullish(),
})
  // Cross-field validation: endDate must be after or equal to startDate
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "La data di fine deve essere uguale o successiva alla data di inizio",
      path: ["endDate"], // Show error on endDate field
    }
  )
  // Financial terms are all-or-nothing: a contract either fully opts into
  // auto-generation or leaves it off entirely (matches the backend, which
  // only generates when financialTypeId + annualValue + billingFrequency
  // are ALL present).
  // A tacit renewal is only useful with both terms: without the notice the
  // deadline can't be computed, without the length the renewal can't be
  // applied. (The backend accepts them missing, e.g. from an import.)
  .refine((data) => !data.autoRenew || data.noticeDays != null, {
    message: "Indica i giorni di preavviso previsti dal contratto",
    path: ["noticeDays"],
  })
  .refine((data) => !data.autoRenew || data.renewalMonths != null, {
    message: "Indica per quanti mesi si rinnova",
    path: ["renewalMonths"],
  })
  // The last day to give notice (endDate minus noticeDays) can't fall before
  // startDate: the notice would be longer than the contract itself, an
  // impossible term, so it blocks saving. A deadline already passed is real
  // and only gets a warning in ContractForm.
  .refine(
    (data) => {
      if (!data.autoRenew || data.noticeDays == null) return true;
      const deadline = computeNoticeDeadline(data.endDate, data.noticeDays);
      const start = computeNoticeDeadline(data.startDate, 0);
      // Unreadable dates are the date fields' own errors, not this one.
      if (!deadline || !start) return true;
      return deadline >= start;
    },
    {
      message: "Il preavviso è più lungo del contratto: la disdetta cadrebbe prima della data di inizio",
      path: ["noticeDays"],
    }
  )
  .refine(
    (data) => {
      const fields = [data.financialTypeId, data.annualValue, data.billingFrequency];
      const setCount = fields.filter((f) => f !== null && f !== undefined).length;
      return setCount === 0 || setCount === 3;
    },
    {
      message: "Per generare i valori finanziari servono tipo, valore annuo e frequenza insieme",
      path: ["annualValue"],
    }
  );

/**
 * TypeScript type inferred from Zod schema
 * Use this instead of manually writing the interface
 */
export type ContractFormData = z.infer<typeof contractSchema>;
