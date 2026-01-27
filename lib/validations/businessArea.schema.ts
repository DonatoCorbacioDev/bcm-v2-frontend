import { z } from "zod";

export const businessAreaSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),

  description: z
    .string({ message: "Description is required" })
    .min(5, "Description must be at least 5 characters")
    .max(500, "Description must not exceed 500 characters")
    .trim(),
});

export type BusinessAreaFormData = z.infer<typeof businessAreaSchema>;