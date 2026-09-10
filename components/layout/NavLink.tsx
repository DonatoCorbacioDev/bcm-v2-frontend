"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/layout/sidebarNavConfig";

/** Single nav entry shared by the desktop Sidebar and MobileSidebar. */
export function NavLink({
  item,
  isActive,
  collapsed = false,
  onClick,
}: {
  readonly item: NavItem;
  readonly isActive: boolean;
  readonly collapsed?: boolean;
  readonly onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
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
