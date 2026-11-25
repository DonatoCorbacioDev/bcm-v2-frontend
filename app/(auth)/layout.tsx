/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { displayFont } from "@/components/landing/fonts";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Newsreader for the large headings (font-display), as on the landing.
    <div className={`${displayFont.variable} min-h-screen flex flex-col bg-background`}>
      <nav aria-label="Salta al contenuto">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-primary focus:rounded focus:shadow-lg focus:outline-none"
        >
          Vai al contenuto principale
        </a>
      </nav>
      {children}
    </div>
  );
}
