import { z } from "zod";

const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

export const organizationBankDetailsSchema = z.object({
  iban: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .refine((value) => value === "" || IBAN_PATTERN.test(value), {
      message: "IBAN non valido",
    }),

  bic: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .refine((value) => value === "" || (value.length >= 8 && value.length <= 11), {
      message: "BIC non valido (8-11 caratteri)",
    }),
});

export type OrganizationBankDetailsFormData = z.infer<typeof organizationBankDetailsSchema>;
