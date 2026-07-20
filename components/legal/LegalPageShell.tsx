"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useDarkMode } from "@/hooks/useDarkMode";

interface LegalPageShellProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly children: React.ReactNode;
}

/** Shared chrome for standalone public legal/compliance pages (Privacy, Trasparenza AI). */
export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Home BCM">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <button
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
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Torna alla home
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <p className="text-[12px] font-semibold text-primary tracking-[0.08em] uppercase mb-3">
            Legale &amp; conformità
          </p>
          <h1 className="text-[32px] md:text-[38px] font-bold text-foreground tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Ultimo aggiornamento: {lastUpdated}
          </p>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground/90 [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:tracking-tight [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-foreground [&_strong]:font-semibold">
            {children}
          </div>
        </div>
      </main>

      <LandingFooter headingLevel="h3" />
    </div>
  );
}
