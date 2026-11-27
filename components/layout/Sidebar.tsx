"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { HelpMenu } from "@/components/layout/HelpMenu";
import { useHomeAttention } from "@/hooks/useHomeAttention";
import { isNow } from "@/components/dashboard/HomeNow";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { LogoMark } from "@/components/layout/Logo";
import { navGroups, isNavItemActive } from "@/components/layout/sidebarNavConfig";
import { NavLink } from "@/components/layout/NavLink";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";

interface SidebarProps {
  readonly collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  // How many things wait on the Home: the same list, from the same cache.
  const { data: attention } = useHomeAttention();
  // The same things the Home's sentence names: what to do now, and the invoices to match.
  const todo = attention?.items?.filter((i) => isNow(i) || i.type === "INVOICE_TO_MATCH").length;


  return (
    <aside
      aria-label="Navigazione principale"
      className={cn(
        "hidden md:flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] h-screen sticky top-0 shrink-0 z-20 overflow-hidden",
        "transition-[width] duration-[160ms] ease-[ease]",
        collapsed ? "w-[70px]" : "w-[252px]"
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          "flex items-center h-[60px] border-b border-[var(--sidebar-border)] shrink-0",
          collapsed ? "justify-center px-0" : "px-4 gap-3"
        )}
      >
        <LogoMark size={32} className="shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p
              title="Business Contracts Manager"
              className="text-[14px] font-bold text-foreground truncate leading-tight"
            >
              BCM
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)] truncate leading-tight">
              Gestione contratti
            </p>
          </div>
        )}
      </div>

      {/* Org switcher */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-[var(--sidebar-border)] shrink-0">
          <OrgSwitcher />
        </div>
      )}

      {/* Navigation */}
      <nav
        aria-label="Navigazione principale"
        className="flex-1 overflow-y-auto py-3"
      >
        {navGroups.filter((group) => !group.bottom).map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title} className="space-y-1 px-2">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isNavItemActive(item, pathname)}
                  collapsed={collapsed}
                  count={item.href === "/dashboard" ? todo : undefined}
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Foot: settings and help, apart from the everyday pages. Logout is in the
          user menu, top right. */}
      <nav aria-label="Impostazioni e aiuto" className="border-t border-[var(--sidebar-border)] shrink-0 space-y-1 px-2 py-3">
        {navGroups.filter((group) => group.bottom).flatMap((group) => group.items)
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <NavLink key={item.href} item={item} isActive={isNavItemActive(item, pathname)} collapsed={collapsed} />
          ))}
        <HelpMenu collapsed={collapsed} />
      </nav>
    </aside>
  );
}
