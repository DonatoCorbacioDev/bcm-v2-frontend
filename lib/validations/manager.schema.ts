import { z } from "zod";

/**
 * Zod validation schema for managers
 * Used for both CREATE and UPDATE operations
 */
export const managerSchema = z.object({
  firstName: z
    .string({ message: "Il nome è obbligatorio" })
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(50, "Il nome non può superare i 50 caratteri")
    .trim(),

  lastName: z
    .string({ message: "Il cognome è obbligatorio" })
    .min(2, "Il cognome deve contenere almeno 2 caratteri")
    .max(50, "Il cognome non può superare i 50 caratteri")
    .trim(),

  email: z
    .string({ message: "L'email è obbligatoria" })
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Formato email non valido"
    )
    .max(100, "L'email non può superare i 100 caratteri")
    .trim(),

  phoneNumber: z
    .string({ message: "Il numero di telefono è obbligatorio" })
    .min(7, "Il numero di telefono deve contenere almeno 7 caratteri")
    .max(20, "Il numero di telefono non può superare i 20 caratteri")
    .regex(
      /^[0-9+\-\s()]+$/,
      "Il numero di telefono può contenere solo numeri, +, -, spazi e parentesi"
    )
    .trim(),

  department: z
    .string({ message: "Il reparto è obbligatorio" })
    .min(2, "Il reparto deve contenere almeno 2 caratteri")
    .max(100, "Il reparto non può superare i 100 caratteri")
    .trim(),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type ManagerFormData = z.infer<typeof managerSchema>;