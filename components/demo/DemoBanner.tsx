"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { isDemoUser } from "@/lib/demo";

/**
 * Inside the public demo only: says the data is an example, reset every
 * night, and offers the real next step, an account of one's own.
 */
export function DemoBanner() {
  const username = useAuthStore((state) => state.user?.username);
  if (!isDemoUser(username)) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border bg-[var(--status-blue-bg)] px-4 py-2 text-center text-sm text-foreground">
      <span>Stai usando la demo: i dati sono di un&apos;azienda di esempio e si azzerano ogni notte.</span>
      <Link href="/register-org" className="font-semibold text-[var(--status-blue-fg)] underline-offset-4 hover:underline">
        Crea il tuo account gratuito
      </Link>
    </div>
  );
}
