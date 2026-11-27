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
import { X } from "lucide-react";
import { navGroups, isNavItemActive } from "@/components/layout/sidebarNavConfig";
import { NavLink } from "@/components/layout/NavLink";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";

interface MobileSidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const { data: attention } = useHomeAttention();
  // The same things the Home's sentence names: what to do now, and the invoices to match.
  const todo = attention?.items?.filter((i) => isNow(i) || i.type === "INVOICE_TO_MATCH").length;

  return (
    <aside
      id="mobile-sidebar"
      aria-label="Navigazione mobile"
      className={cn(
        "md:hidden fixed left-0 top-0 bottom-0 w-[252px] bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] z-30",
        "flex flex-col overflow-hidden transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-[var(--sidebar-border)] shrink-0">
        <div className="flex items-center gap-3">
          <LogoMark size={28} />
          <p className="text-[14px] font-bold text-foreground leading-tight">BCM</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label="Chiudi menu"
        >
          <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>

      {/* Org switcher */}
      <div className="px-3 py-2.5 border-b border-[var(--sidebar-border)] shrink-0">
        <OrgSwitcher />
      </div>

      {/* Nav */}
      <nav aria-label="Navigazione principale" className="flex-1 overflow-y-auto py-3">
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
                  onClick={onClose}
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
            <NavLink key={item.href} item={item} isActive={isNavItemActive(item, pathname)} onClick={onClose} />
          ))}
        <HelpMenu onNavigate={onClose} />
      </nav>
    </aside>
  );
}
