import {
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  TrendingUp,
  Tag,
  Building2,
  Users,
  User,
  Shield,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "GENERALE",
    items: [
      { label: "Dashboard",            href: "/dashboard",          icon: LayoutDashboard },
      { label: "Contratti",            href: "/contracts",          icon: FileText },
      { label: "Modelli di contratto", href: "/contract-templates", icon: LayoutTemplate },
      { label: "Valori finanziari",    href: "/financial-values",   icon: TrendingUp },
    ],
  },
  {
    title: "AMMINISTRAZIONE",
    items: [
      { label: "Tipi finanziari",   href: "/financial-types", icon: Tag,       adminOnly: true },
      { label: "Aree di business",  href: "/business-areas",  icon: Building2, adminOnly: true },
      { label: "Responsabili",      href: "/managers",         icon: Users,     adminOnly: true },
      { label: "Utenti",            href: "/users",            icon: User,      adminOnly: true },
      { label: "Organizzazione",    href: "/organization",     icon: Landmark,  adminOnly: true },
      { label: "Registro attività", href: "/audit-logs",       icon: Shield,    adminOnly: true },
    ],
  },
];
