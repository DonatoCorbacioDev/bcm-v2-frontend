"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  X,
  LayoutDashboard,
  FileText,
  TrendingUp,
  Tag,
  Building2,
  Users,
  User,
  Shield,
  type LucideIcon,
} from "lucide-react";

const navItems: { label: string; href: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { label: "Dashboard",        href: "/dashboard",        icon: LayoutDashboard },
  { label: "Contracts",        href: "/contracts",        icon: FileText },
  { label: "Financial Values", href: "/financial-values", icon: TrendingUp },
  { label: "Financial Types",  href: "/financial-types",  icon: Tag,       adminOnly: true },
  { label: "Business Areas",   href: "/business-areas",   icon: Building2, adminOnly: true },
  { label: "Managers",         href: "/managers",         icon: Users,     adminOnly: true },
  { label: "Users",            href: "/users",            icon: User,      adminOnly: true },
  { label: "Audit Log",        href: "/audit-logs",       icon: Shield,    adminOnly: true },
];

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function NavLink({
  item,
  isActive,
  onClick,
}: {
  readonly item: (typeof navItems)[number];
  readonly isActive: boolean;
  readonly onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon
        aria-hidden="true"
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-primary-foreground" : "text-muted-foreground"
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto z-10">
        <div className="flex-1 py-4">
          <nav aria-label="Main navigation" className="p-3 space-y-1">
            {visibleItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        id="mobile-sidebar"
        aria-label="Mobile navigation"
        className={cn(
          "md:hidden fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border overflow-y-auto z-30 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-3 border-b border-border flex justify-end">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="py-4">
          <nav aria-label="Main navigation" className="px-3 space-y-1">
            {visibleItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClick={onClose}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
