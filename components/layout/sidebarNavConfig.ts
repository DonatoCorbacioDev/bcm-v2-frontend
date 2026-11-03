/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import {
  Home,
  FileText,
  Handshake,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /**
   * Other routes this entry stands for: the pages reached from it, which have
   * no menu entry of their own, keep it highlighted so the user still sees
   * where they are.
   */
  activeFor?: readonly string[];
}

/**
 * The pages grouped under Impostazioni. They keep their own routes, so links
 * into them (empty states, banners, bookmarks) keep working; only the menu
 * entry moved. The settings page lists them; this list drives the highlight.
 */
export const SETTINGS_ROUTES = [
  "/organization",
  "/users",
  "/managers",
  "/business-areas",
  "/financial-types",
  "/contract-templates",
  "/financial-values",
  "/budgets",
  "/audit-logs",
] as const;

/**
 * Deliberately short: a new user should see at a glance what BCM is for.
 * Everything else is one click away, from Impostazioni or from the page it
 * belongs to (a contract's documents, invoices and financial values live in
 * the contract).
 */
export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "GENERALE",
    items: [
      { label: "Home",        href: "/dashboard",      icon: Home },
      { label: "Contratti",   href: "/contracts",      icon: FileText },
      { label: "Controparti", href: "/counterparties", icon: Handshake },
    ],
  },
  {
    title: "AMMINISTRAZIONE",
    items: [
      { label: "Impostazioni", href: "/settings", icon: Settings, adminOnly: true, activeFor: SETTINGS_ROUTES },
    ],
  },
];

const isSameOrChild = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

/** True on the entry's own page, its sub-pages (/contracts/12) and the routes it stands for. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return [item.href, ...(item.activeFor ?? [])].some((route) => isSameOrChild(pathname, route));
}
