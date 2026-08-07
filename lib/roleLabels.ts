export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Amministratore",
  MANAGER: "Responsabile",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
