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
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-100"
      )}
    >
      <item.icon
        aria-hidden="true"
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
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
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed left-0 top-16 bottom-0 overflow-y-auto z-10">
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
          "md:hidden fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto z-30 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
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
