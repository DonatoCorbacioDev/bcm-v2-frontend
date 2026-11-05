/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { z } from "zod";

export const businessAreaSchema = z.object({
  name: z
    .string({ message: "Il nome è obbligatorio" })
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(100, "Il nome non può superare i 100 caratteri")
    .trim(),

  // Optional: the name usually says it all ("Acquisti", "IT").
  description: z
    .string()
    .trim()
    .max(500, "La descrizione non può superare i 500 caratteri")
    .optional(),
});

export type BusinessAreaFormData = z.infer<typeof businessAreaSchema>;