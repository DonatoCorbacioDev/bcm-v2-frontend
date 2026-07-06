import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Single source of truth for the Italian label of each contract status. */
export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Attivo",
  EXPIRED: "Scaduto",
  CANCELLED: "Annullato",
};

/**
 * Maps contract status to Badge component variant
 * @param status - Contract status (ACTIVE, EXPIRED, CANCELLED)
 * @returns Badge variant name
 */
export function getContractStatusVariant(status: string): "success" | "destructive" | "secondary" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
      return "destructive";
    case "CANCELLED":
      return "secondary";
    default:
      return "default";
  }
}