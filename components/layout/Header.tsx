"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Search, Moon, Sun, PanelLeft, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";
import { useDarkMode } from "@/hooks/useDarkMode";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/roleLabels";
import Link from "next/link";

// Single-line wayfinding label only — each page's own <h1> (rendered below,
// scrolls out of view under this sticky header) is the source of truth for
// the page's title and description, so this must not duplicate that text.
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":          "Dashboard",
  "/contracts":          "Contratti",
  "/contract-templates": "Modelli di contratto",
  "/financial-values":   "Valori finanziari",
  "/financial-types":    "Tipi finanziari",
  "/budgets":            "Budget",
  "/business-areas":     "Aree di business",
  "/managers":           "Responsabili",
  "/users":              "Utenti",
  "/organization":       "Organizzazione",
  "/audit-logs":         "Registro attività",
  "/profile":            "Profilo",
};

function getPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Contract detail page
  if (pathname.startsWith("/contracts/")) return "Dettaglio contratto";
  return "Business Contracts Manager";
}

function getUserInitials(username?: string): string {
  if (!username) return "U";
  const parts = username.split(/[\s._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

interface HeaderProps {
  readonly onMenuClick: () => void;
  readonly isMenuOpen?: boolean;
  readonly collapsed: boolean;
  readonly onCollapseToggle: () => void;
}

export default function Header({
  onMenuClick,
  isMenuOpen = false,
  collapsed,
  onCollapseToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore(/* istanbul ignore next */ (state) => state.user);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const title = getPageTitle(pathname);
  const initials = getUserInitials(user?.username);

  return (
    <header
      className={cn(
        "h-[60px] bg-card/80 backdrop-blur-sm border-b border-border",
        "sticky top-0 z-10 flex items-center gap-3 px-4",
      )}
    >
      {/* Collapse toggle — desktop */}
      <button
        type="button"
        onClick={onCollapseToggle}
        className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0"
        aria-label={collapsed ? "Espandi menu" : "Comprimi menu"}
        title={collapsed ? "Espandi menu" : "Comprimi menu"}
      >
        <PanelLeft className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
      </button>

      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0"
        aria-label="Apri menu"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-sidebar"
      >
        <PanelLeft className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
      </button>

      {/* Page title — intentionally a <p>, not <h1>; the real h1 lives in each page's main content */}
      <div className="hidden sm:flex items-center min-w-0">
        <p className="text-[14.5px] font-semibold text-foreground leading-tight truncate">
          {title}
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden lg:flex items-center gap-2 h-9 w-[240px] px-3 rounded-lg border border-border bg-background text-[13px] text-muted-foreground">
        <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">Cerca contratti, controparti…</span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <NotificationBell />

        <button
          type="button"
          onClick={toggleDark}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label={isDark ? "Modalità chiara" : "Modalità scura"}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        <div className="h-5 w-px bg-border mx-1" aria-hidden="true" />

        {/* User button */}
        <Link
          href="/profile"
          className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted transition-colors group"
          aria-label="Vai al profilo"
        >
          <span className="h-7 w-7 rounded-md bg-[#1d4ed8] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {initials}
          </span>
          <div className="hidden sm:flex flex-col items-start min-w-0">
            <span className="text-[12px] font-semibold text-foreground leading-tight truncate max-w-[90px]">
              {user?.username ?? "Utente"}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight capitalize">
              {roleLabel(user?.role ?? "MANAGER")}
            </span>
          </div>
          <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
