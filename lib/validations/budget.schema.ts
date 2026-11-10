/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { z } from "zod";

/**
 * Zod validation schema for budgets
 * Used for both CREATE and UPDATE operations
 */
export const budgetSchema = z.object({
  businessAreaId: z
    .string({ message: "L'area di business è obbligatoria" })
    .min(1, "L'area di business è obbligatoria")
    .uuid("L'area di business è obbligatoria"),

  category: z.enum(["REVENUE", "COST"], { message: "Seleziona una categoria" }),

  year: z
    .number({ message: "L'anno è obbligatorio" })
    .int("L'anno deve essere un numero intero")
    .min(2000, "L'anno deve essere 2000 o successivo")
    .max(2100, "L'anno deve essere 2100 o precedente"),

  targetAmount: z
    .number({ message: "L'importo obiettivo è obbligatorio" })
    .positive("L'importo obiettivo deve essere positivo"),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
