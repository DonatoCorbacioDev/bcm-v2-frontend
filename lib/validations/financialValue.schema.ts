import { z } from "zod";

/**
 * Zod validation schema for financial values
 * Used for both CREATE and UPDATE operations
 */
export const financialValueSchema = z.object({
  month: z
    .number({ message: "Il mese è obbligatorio" })
    .int("Il mese deve essere un numero intero")
    .min(1, "Il mese deve essere compreso tra 1 e 12")
    .max(12, "Il mese deve essere compreso tra 1 e 12"),

  year: z
    .number({ message: "L'anno è obbligatorio" })
    .int("L'anno deve essere un numero intero")
    .min(2000, "L'anno deve essere 2000 o successivo")
    .max(2100, "L'anno deve essere 2100 o precedente"),

  financialAmount: z
    .number({ message: "L'importo è obbligatorio" })
    .positive("L'importo deve essere positivo"),

  financialTypeId: z
    .number({ message: "Il tipo finanziario è obbligatorio" })
    .int("Il tipo finanziario deve essere un numero intero")
    .positive("Il tipo finanziario deve essere un numero positivo"),

  businessAreaId: z
    .number({ message: "L'area di business è obbligatoria" })
    .int("L'area di business deve essere un numero intero")
    .positive("L'area di business deve essere un numero positivo"),

  contractId: z
    .number({ message: "Il contratto è obbligatorio" })
    .int("Il contratto deve essere un numero intero")
    .positive("Il contratto deve essere un numero positivo"),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type FinancialValueFormData = z.infer<typeof financialValueSchema>;