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
  count,
}: {
  readonly item: NavItem;
  readonly isActive: boolean;
  readonly collapsed?: boolean;
  readonly onClick?: () => void;
  /** Things waiting on this page (the Home's to-do list): shown when above zero. */
  readonly count?: number;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors duration-100",
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
          "h-[18px] w-[18px]",
          isActive ? "text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)]"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {count != null && count > 0 && (
        <span
          className={cn(
            "rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground tabular-nums",
            collapsed ? "absolute right-1 top-1 min-w-4 text-center leading-4" : "ml-auto min-w-5 text-center"
          )}
        >
          {count}
          <span className="sr-only"> da fare</span>
        </span>
      )}
    </Link>
  );
}
