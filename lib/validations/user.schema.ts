/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { z } from "zod";
import { passwordSchema } from "./password";

// Schema for creating a new user (password required)
export const userCreateSchema = z.object({
  username: z
    .string({ message: "Il nome utente è obbligatorio" })
    .min(3, "Il nome utente deve contenere almeno 3 caratteri")
    .max(50, "Il nome utente non può superare i 50 caratteri")
    .regex(/^[a-zA-Z0-9_-]+$/, "Il nome utente può contenere solo lettere, numeri, underscore e trattini")
    .trim(),

  password: passwordSchema(),

  managerId: z
    .string({ message: "Il manager è obbligatorio" })
    .min(1, "Il manager è obbligatorio")
    .pipe(z.uuid("Seleziona un manager valido")),

  roleId: z
    .string({ message: "Il ruolo è obbligatorio" })
    .min(1, "Il ruolo è obbligatorio")
    .pipe(z.uuid("Seleziona un ruolo valido")),

  verified: z.boolean(),

  canApproveContracts: z.boolean(),
});

// Schema for updating a user (password optional)
export const userUpdateSchema = z.object({
  username: z
    .string({ message: "Il nome utente è obbligatorio" })
    .min(3, "Il nome utente deve contenere almeno 3 caratteri")
    .max(50, "Il nome utente non può superare i 50 caratteri")
    .regex(/^[a-zA-Z0-9_-]+$/, "Il nome utente può contenere solo lettere, numeri, underscore e trattini")
    .trim(),

  // Empty keeps the current password.
  password: passwordSchema().optional().or(z.literal("")),

  managerId: z
    .string({ message: "Il manager è obbligatorio" })
    .min(1, "Il manager è obbligatorio")
    .pipe(z.uuid("Seleziona un manager valido")),

  roleId: z
    .string({ message: "Il ruolo è obbligatorio" })
    .min(1, "Il ruolo è obbligatorio")
    .pipe(z.uuid("Seleziona un ruolo valido")),

  verified: z.boolean(),

  canApproveContracts: z.boolean(),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;