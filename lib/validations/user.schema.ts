import { z } from "zod";

// Schema for creating a new user (password required)
export const userCreateSchema = z.object({
  username: z
    .string({ message: "Il nome utente è obbligatorio" })
    .min(3, "Il nome utente deve contenere almeno 3 caratteri")
    .max(50, "Il nome utente non può superare i 50 caratteri")
    .regex(/^[a-zA-Z0-9_-]+$/, "Il nome utente può contenere solo lettere, numeri, underscore e trattini")
    .trim(),

  password: z
    .string({ message: "La password è obbligatoria" })
    .min(8, "La password deve contenere almeno 8 caratteri")
    .max(100, "La password non può superare i 100 caratteri"),

  managerId: z
    .number({ message: "Il manager è obbligatorio" })
    .int()
    .positive("Seleziona un manager valido"),

  roleId: z
    .number({ message: "Il ruolo è obbligatorio" })
    .int()
    .positive("Seleziona un ruolo valido"),

  verified: z.boolean(),
});

// Schema for updating a user (password optional)
export const userUpdateSchema = z.object({
  username: z
    .string({ message: "Il nome utente è obbligatorio" })
    .min(3, "Il nome utente deve contenere almeno 3 caratteri")
    .max(50, "Il nome utente non può superare i 50 caratteri")
    .regex(/^[a-zA-Z0-9_-]+$/, "Il nome utente può contenere solo lettere, numeri, underscore e trattini")
    .trim(),

  password: z
    .string()
    .min(8, "La password deve contenere almeno 8 caratteri")
    .max(100, "La password non può superare i 100 caratteri")
    .optional()
    .or(z.literal("")),

  managerId: z
    .number({ message: "Il manager è obbligatorio" })
    .int()
    .positive("Seleziona un manager valido"),

  roleId: z
    .number({ message: "Il ruolo è obbligatorio" })
    .int()
    .positive("Seleziona un ruolo valido"),

  verified: z.boolean(),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;