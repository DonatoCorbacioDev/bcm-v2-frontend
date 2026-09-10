"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/layout/Logo";
import { navGroups } from "@/components/layout/sidebarNavConfig";
import { NavLink } from "@/components/layout/NavLink";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";
import { SidebarLogoutButton } from "@/components/layout/SidebarLogoutButton";

interface SidebarProps {
  readonly collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

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
        className="flex-1 overflow-y-auto py-3 space-y-1"
      >
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-4 pb-1 pt-2 text-[10.5px] font-semibold text-[var(--muted-foreground)] tracking-[0.07em] uppercase">
                  {group.title}
                </p>
              )}
              <div className={cn("space-y-0.5 px-2")}>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] shrink-0 py-3 px-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2.5 pb-2 text-[10.5px] text-[var(--muted-foreground)]">
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/trasparenza-ai" className="hover:text-foreground hover:underline">
              Trasparenza AI
            </Link>
          </div>
        )}
        <SidebarLogoutButton onLogout={handleLogout} collapsed={collapsed} />
      </div>
    </aside>
  );
}
