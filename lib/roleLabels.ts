/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Amministratore",
  MANAGER: "Responsabile",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
