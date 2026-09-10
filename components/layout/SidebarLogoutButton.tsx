"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/** Logout button shared by the desktop Sidebar and MobileSidebar footers. */
export function SidebarLogoutButton({
  onLogout,
  collapsed = false,
}: {
  readonly onLogout: () => void;
  readonly collapsed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onLogout}
      title={collapsed ? "Esci" : undefined}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13px] font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-destructive transition-colors duration-100",
        collapsed && "justify-center px-2"
      )}
    >
      <LogOut className={cn("shrink-0", collapsed ? "h-[18px] w-[18px]" : "h-[16px] w-[16px]")} aria-hidden="true" />
      {!collapsed && <span>Esci</span>}
    </button>
  );
}
