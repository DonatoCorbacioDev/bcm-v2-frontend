import { z } from "zod";

export const contractTemplateSchema = z.object({
  name: z
    .string({ message: "Il nome del template è obbligatorio" })
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(255, "Il nome non può superare i 255 caratteri")
    .trim(),

  description: z
    .string()
    .max(2000, "La descrizione non può superare i 2000 caratteri")
    .trim()
    .optional()
    .nullable(),

  defaultStatus: z
    .enum(["ACTIVE", "EXPIRED", "CANCELLED", "DRAFT"])
    .optional()
    .nullable(),

  defaultDurationDays: z
    .number()
    .int("La durata deve essere un numero intero")
    .positive("La durata deve essere un numero positivo")
    .optional()
    .nullable(),

  businessAreaId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  defaultManagerId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  autoRenew: z.boolean(),

  notificationDays: z
    .number()
    .int("I giorni di notifica devono essere un numero intero")
    .positive("I giorni di notifica devono essere un numero positivo")
    .optional()
    .nullable(),
});

export type ContractTemplateFormData = z.infer<typeof contractTemplateSchema>;

export const instantiateTemplateSchema = z.object({
  customerName: z
    .string({ message: "Il nome del cliente è obbligatorio" })
    .min(2, "Il nome del cliente deve contenere almeno 2 caratteri")
    .max(100)
    .trim(),

  contractNumber: z
    .string({ message: "Il numero contratto è obbligatorio" })
    .min(1, "Il numero contratto è obbligatorio")
    .max(50)
    .regex(
      /^[A-Z0-9-]+$/,
      "Solo lettere maiuscole, numeri e trattini"
    )
    .trim(),

  wbsCode: z.string().max(50).trim().optional().nullable(),
  projectName: z.string().max(200).trim().optional().nullable(),

  startDate: z
    .string({ message: "La data di inizio è obbligatoria" })
    .min(1, "La data di inizio è obbligatoria")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato AAAA-MM-GG"),

  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato AAAA-MM-GG")
    .optional()
    .nullable(),

  businessAreaId: z.number().int().positive().optional().nullable(),
  managerId: z.number().int().positive().optional().nullable(),

  status: z
    .enum(["ACTIVE", "EXPIRED", "CANCELLED", "DRAFT"])
    .optional()
    .nullable(),
});

export type InstantiateTemplateFormData = z.infer<typeof instantiateTemplateSchema>;
