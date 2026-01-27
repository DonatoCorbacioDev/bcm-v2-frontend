import { z } from "zod";

/**
 * Zod validation schema for financial values
 * Used for both CREATE and UPDATE operations
 */
export const financialValueSchema = z.object({
  month: z
    .number({ message: "Month is required" })
    .int("Month must be an integer")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),

  year: z
    .number({ message: "Year is required" })
    .int("Year must be an integer")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),

  financialAmount: z
    .number({ message: "Amount is required" })
    .positive("Amount must be positive"),

  financialTypeId: z
    .number({ message: "Financial type is required" })
    .int("Financial type must be an integer")
    .positive("Financial type must be a positive number"),

  businessAreaId: z
    .number({ message: "Business area is required" })
    .int("Business area must be an integer")
    .positive("Business area must be a positive number"),

  contractId: z
    .number({ message: "Contract is required" })
    .int("Contract must be an integer")
    .positive("Contract must be a positive number"),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type FinancialValueFormData = z.infer<typeof financialValueSchema>;