"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { SETTINGS_SECTIONS } from "@/components/settings/settingsSections";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-muted-foreground mt-2">
          Organizzazione, utenti, dati di base e strumenti avanzati
        </p>
      </div>

      {SETTINGS_SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`settings-${section.id}`} className="space-y-3">
          <h2 id={`settings-${section.id}`} className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {section.title}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.links.map(({ href, label, description, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
                  </span>
                  <ChevronRight
                    className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
