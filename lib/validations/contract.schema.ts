import { z } from "zod";

/**
 * Zod validation schema for contracts
 * Used for both CREATE and UPDATE operations
 */
export const contractSchema = z.object({
  // Customer information
  customerName: z
    .string({ message: "Customer name is required" })
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must not exceed 100 characters")
    .trim(),

  // Contract number (format: C001, C002, etc.)
  contractNumber: z
    .string({ message: "Contract number is required" })
    .min(1, "Contract number is required")
    .max(50, "Contract number must not exceed 50 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "Contract number must contain only uppercase letters, numbers, and hyphens"
    )
    .trim(),

  // WBS code (Work Breakdown Structure)
  wbsCode: z
    .string({ message: "WBS code is required" })
    .min(1, "WBS code is required")
    .max(50, "WBS code must not exceed 50 characters")
    .trim(),

  // Project name
  projectName: z
    .string({ message: "Project name is required" })
    .min(3, "Project name must be at least 3 characters")
    .max(200, "Project name must not exceed 200 characters")
    .trim(),

  // Start date (ISO format: YYYY-MM-DD)
  startDate: z
    .string({ message: "Start date is required" })
    .min(1, "Start date is required")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Start date must be in YYYY-MM-DD format"
    ),

  // End date (ISO format: YYYY-MM-DD)
  endDate: z
    .string({ message: "End date is required" })
    .min(1, "End date is required")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "End date must be in YYYY-MM-DD format"
    ),

  // Contract status
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"], {
    message: "Status must be ACTIVE, EXPIRED, or CANCELLED",
  }),

  // Business area ID (foreign key)
  areaId: z
    .number({ message: "Business area is required" })
    .int("Business area must be an integer")
    .positive("Business area must be a positive number"),

  // Manager ID (foreign key)
  managerId: z
    .number({ message: "Manager is required" })
    .int("Manager must be an integer")
    .positive("Manager must be a positive number"),
})
  // Cross-field validation: endDate must be after or equal to startDate
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "End date must be equal to or after start date",
      path: ["endDate"], // Show error on endDate field
    }
  );

/**
 * TypeScript type inferred from Zod schema
 * Use this instead of manually writing the interface
 */
export type ContractFormData = z.infer<typeof contractSchema>;
