/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import {
  Landmark,
  User,
  Users,
  Building2,
  Tag,
  LayoutTemplate,
  TrendingUp,
  Wallet,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface SettingsLink {
  readonly href: string;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

/*
 * Every page that left the sidebar is listed here, so none of them becomes
 * unreachable. Keep in sync with SETTINGS_ROUTES in sidebarNavConfig (a test
 * checks it).
 */
export const SETTINGS_SECTIONS: { id: string; title: string; links: SettingsLink[] }[] = [
  {
    id: "access",
    title: "Organizzazione e accessi",
    links: [
      { href: "/organization", label: "Organizzazione", icon: Landmark,
        description: "Dati dell'azienda, piano, esportazione e cancellazione dei dati" },
      { href: "/users", label: "Utenti", icon: User,
        description: "Chi accede a BCM e con quale ruolo" },
      { href: "/managers", label: "Responsabili", icon: Users,
        description: "Le persone che seguono i contratti" },
    ],
  },
  {
    id: "master-data",
    title: "Dati di base",
    links: [
      { href: "/business-areas", label: "Aree di business", icon: Building2,
        description: "Come raggruppi i contratti, per esempio IT o Operazioni" },
      { href: "/financial-types", label: "Tipi finanziari", icon: Tag,
        description: "Le categorie di ricavi e costi" },
    ],
  },
  {
    id: "advanced",
    title: "Strumenti avanzati",
    links: [
      { href: "/contract-templates", label: "Modelli di contratto", icon: LayoutTemplate,
        description: "Bozze riutilizzabili per i contratti che si ripetono" },
      { href: "/financial-values", label: "Valori finanziari", icon: TrendingUp,
        description: "Tutti gli importi previsti, di tutti i contratti" },
      { href: "/budgets", label: "Budget", icon: Wallet,
        description: "Obiettivi annuali di ricavi e costi per area" },
    ],
  },
  {
    id: "security",
    title: "Sicurezza",
    links: [
      { href: "/audit-logs", label: "Registro attività", icon: Shield,
        description: "Chi ha fatto cosa, e quando" },
    ],
  },
];
