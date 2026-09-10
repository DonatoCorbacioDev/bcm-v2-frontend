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
import { X } from "lucide-react";
import { navGroups } from "@/components/layout/sidebarNavConfig";
import { NavLink } from "@/components/layout/NavLink";
import { OrgSwitcher } from "@/components/layout/OrgSwitcher";
import { SidebarLogoutButton } from "@/components/layout/SidebarLogoutButton";

interface MobileSidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    router.push("/login");
    onClose();
  };

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
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="px-4 pb-1 pt-2 text-[10.5px] font-semibold text-[var(--muted-foreground)] tracking-[0.07em] uppercase">
                {group.title}
              </p>
              <div className="px-2 space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] px-2 py-3 shrink-0">
        <div className="flex items-center gap-2 px-2.5 pb-2 text-[10.5px] text-[var(--muted-foreground)]">
          <Link href="/privacy" onClick={onClose} className="hover:text-foreground hover:underline">
            Privacy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/trasparenza-ai" onClick={onClose} className="hover:text-foreground hover:underline">
            Trasparenza AI
          </Link>
        </div>
        <SidebarLogoutButton onLogout={handleLogout} />
      </div>
    </aside>
  );
}
