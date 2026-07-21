import { z } from "zod";

export const financialTypeSchema = z.object({
  name: z
    .string({ message: "Il nome è obbligatorio" })
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(100, "Il nome non può superare i 100 caratteri")
    .trim(),

  description: z
    .string({ message: "La descrizione è obbligatoria" })
    .min(5, "La descrizione deve contenere almeno 5 caratteri")
    .max(500, "La descrizione non può superare i 500 caratteri")
    .trim(),

  category: z.enum(["REVENUE", "COST"], { message: "Seleziona una categoria" }),
});

export type FinancialTypeFormData = z.infer<typeof financialTypeSchema>;
