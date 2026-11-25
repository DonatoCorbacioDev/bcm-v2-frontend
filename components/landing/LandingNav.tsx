"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import { LogoMark } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isDark, toggle } = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#features", label: "Funzionalità" },
    { href: "#how-it-works", label: "Come funziona" },
    { href: "#pricing", label: "Piani" },
    { href: "#how-its-built", label: "Come è fatto" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Home BCM" className="inline-flex items-center gap-2.5">
          <LogoMark size={32} />
          {/* The full name on three lines crowds a phone's bar: the short one there. */}
          <span className="text-[15px] font-bold leading-tight tracking-tight text-foreground" aria-hidden="true">
            <span className="sm:hidden">BCM</span>
            <span className="hidden sm:inline">Business Contracts Manager</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigazione principale">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label={isDark ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Apri BCM</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Accedi</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register-org">Inizia gratis</Link>
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="md:hidden border-t border-border bg-background px-4 py-2 flex flex-col"
          aria-label="Navigazione mobile"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 text-base text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {!isAuthenticated && (
            <Link href="/login" className="py-3 text-base text-muted-foreground hover:text-foreground">
              Accedi
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
