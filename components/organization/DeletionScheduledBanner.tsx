"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { organizationService } from "@/services/organization.service";
import { formatDeletionDate } from "@/lib/deletionDate";

/**
 * Shown on every page to admins while a deletion is scheduled, so it can't
 * go unnoticed for 30 days. Same query as the sidebar's OrgSwitcher, so it
 * costs no extra request; only admins can read the organization (and cancel).
 */
export function DeletionScheduledBanner() {
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const { data: organization } = useQuery({
    queryKey: ["organization", "me"],
    queryFn: organizationService.getMine,
    enabled: isAdmin,
  });

  if (!isAdmin || !organization?.deletionScheduledFor) return null;

  return (
    <section
      aria-label="Cancellazione programmata"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <p className="flex-1 text-sm text-foreground">
        L&apos;organizzazione e tutti i suoi dati saranno cancellati il{" "}
        <strong>{formatDeletionDate(organization.deletionScheduledFor)}</strong>.
      </p>
      <Link
        href="/organization#cancellazione"
        className="text-sm font-medium text-foreground underline underline-offset-4 hover:no-underline"
      >
        Annulla o esporta i dati
      </Link>
    </section>
  );
}
