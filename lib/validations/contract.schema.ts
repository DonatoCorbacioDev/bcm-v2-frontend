import { z } from "zod";

/**
 * Zod validation schema for contracts
 * Used for both CREATE and UPDATE operations
 */
export const contractSchema = z.object({
  // Customer information
  customerName: z
    .string({ message: "Il nome del cliente è obbligatorio" })
    .min(2, "Il nome del cliente deve contenere almeno 2 caratteri")
    .max(100, "Il nome del cliente non può superare i 100 caratteri")
    .trim(),

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

  // WBS code (Work Breakdown Structure)
  wbsCode: z
    .string({ message: "Il codice WBS è obbligatorio" })
    .min(1, "Il codice WBS è obbligatorio")
    .max(50, "Il codice WBS non può superare i 50 caratteri")
    .trim(),

  // Project name
  projectName: z
    .string({ message: "Il nome del progetto è obbligatorio" })
    .min(3, "Il nome del progetto deve contenere almeno 3 caratteri")
    .max(200, "Il nome del progetto non può superare i 200 caratteri")
    .trim(),

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
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"], {
    message: "Lo stato deve essere ACTIVE, EXPIRED o CANCELLED",
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
  );

/**
 * TypeScript type inferred from Zod schema
 * Use this instead of manually writing the interface
 */
export type ContractFormData = z.infer<typeof contractSchema>;
