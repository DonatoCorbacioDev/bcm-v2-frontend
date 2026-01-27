import { z } from "zod";

// Schema for creating a new user (password required)
export const userCreateSchema = z.object({
  username: z
    .string({ message: "Username is required" })
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .trim(),

  password: z
    .string({ message: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),

  managerId: z
    .number({ message: "Manager is required" })
    .int()
    .positive("Please select a valid manager"),

  roleId: z
    .number({ message: "Role is required" })
    .int()
    .positive("Please select a valid role"),

  verified: z.boolean(), // Removed .default(false)
});

// Schema for updating a user (password optional)
export const userUpdateSchema = z.object({
  username: z
    .string({ message: "Username is required" })
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .trim(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .optional()
    .or(z.literal("")),

  managerId: z
    .number({ message: "Manager is required" })
    .int()
    .positive("Please select a valid manager"),

  roleId: z
    .number({ message: "Role is required" })
    .int()
    .positive("Please select a valid role"),

  verified: z.boolean(),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;