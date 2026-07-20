"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { organizationService } from "@/services/organization.service";
import { LogoMark } from "@/components/layout/Logo";
import { LogOut } from "lucide-react";
import { navGroups, type NavItem } from "@/components/layout/sidebarNavConfig";

const TIER_LABELS: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

interface SidebarProps {
  readonly collapsed: boolean;
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  readonly item: NavItem;
  readonly isActive: boolean;
  readonly collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13px] font-medium transition-colors duration-100",
        isActive
          ? "bg-[var(--sidebar-accent)] text-[var(--accent-foreground)] font-semibold"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <item.icon
        aria-hidden="true"
        className={cn(
          "shrink-0",
          collapsed ? "h-[18px] w-[18px]" : "h-[16px] w-[16px]",
          isActive ? "text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)]"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { data: organization } = useQuery({
    queryKey: ["organization", "me"],
    queryFn: organizationService.getMine,
    enabled: isAdmin,
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const orgInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "CE";

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
            <p className="text-[14px] font-bold text-foreground truncate leading-tight">
              Business Contracts Manager
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
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors group"
          >
            <span className="h-7 w-7 rounded-md bg-[var(--primary)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {orgInitials}
            </span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-semibold text-foreground truncate">
                {organization?.name ?? "Organizzazione"}
              </p>
              {organization && (
                <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                  Piano {TIER_LABELS[organization.subscriptionTier] ?? organization.subscriptionTier}
                </p>
              )}
            </div>
          </button>
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
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Esci" : undefined}
          className={cn(
            "w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13px] font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-destructive transition-colors duration-100",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className={cn("shrink-0", collapsed ? "h-[18px] w-[18px]" : "h-[16px] w-[16px]")} aria-hidden="true" />
          {!collapsed && <span>Esci</span>}
        </button>
      </div>
    </aside>
  );
}
