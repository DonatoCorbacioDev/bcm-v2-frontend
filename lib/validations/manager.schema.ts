import { z } from "zod";

/**
 * Zod validation schema for managers
 * Used for both CREATE and UPDATE operations
 */
export const managerSchema = z.object({
  firstName: z
    .string({ message: "First name is required" })
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .trim(),

  lastName: z
    .string({ message: "Last name is required" })
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .trim(),

  email: z
    .string({ message: "Email is required" })
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email format"
    )
    .max(100, "Email must not exceed 100 characters")
    .trim(),

  phoneNumber: z
    .string({ message: "Phone number is required" })
    .min(7, "Phone number must be at least 7 characters")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(
      /^[0-9+\-\s()]+$/,
      "Phone number can only contain numbers, +, -, spaces, and parentheses"
    )
    .trim(),

  department: z
    .string({ message: "Department is required" })
    .min(2, "Department must be at least 2 characters")
    .max(100, "Department must not exceed 100 characters")
    .trim(),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type ManagerFormData = z.infer<typeof managerSchema>;