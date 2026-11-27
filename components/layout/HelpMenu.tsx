"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, CircleHelp, FileLock2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { feedbackHref } from "@/components/layout/FeedbackLink";

/**
 * "Aiuto": the things used now and then, in one place at the foot of the
 * menu instead of five small links. The calculator opens in a new tab, so
 * the page one is working on stays where it is.
 */
export function HelpMenu({ collapsed = false, onNavigate }: { readonly collapsed?: boolean; readonly onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={collapsed ? "Aiuto" : undefined}
        aria-label={collapsed ? "Aiuto" : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-[var(--muted)] data-[state=open]:text-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <CircleHelp className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {!collapsed && "Aiuto"}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-60">
        <DropdownMenuItem asChild>
          <a href="/calcolo-disdetta" target="_blank" rel="noopener" onClick={onNavigate}>
            <Calculator className="mr-2 h-4 w-4" aria-hidden="true" />
            Calcolo disdetta
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={feedbackHref(pathname)} onClick={onNavigate}>
            <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
            Dai un parere
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/privacy" onClick={onNavigate}>
            <FileLock2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Privacy
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/trasparenza-ai" onClick={onNavigate}>
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            Trasparenza sull&apos;AI
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
