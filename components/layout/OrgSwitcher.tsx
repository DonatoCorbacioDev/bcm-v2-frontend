"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { organizationService } from "@/services/organization.service";
import { tierLabel } from "@/lib/tierLabels";

function orgInitialsFrom(orgName: string | null | undefined): string {
  if (!orgName) return "OR";
  return orgName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Org name/plan + avatar, shared by the desktop Sidebar and MobileSidebar.
 * Self-contained (reads auth/organization state itself) so either sidebar
 * can just drop it in.
 */
export function OrgSwitcher() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  const { data: organization } = useQuery({
    queryKey: ["organization", "me"],
    queryFn: organizationService.getMine,
    enabled: isAdmin,
  });

  const orgName = organization?.name ?? user?.organizationName;
  const orgInitials = orgInitialsFrom(orgName);

  const avatar = (
    <span className="h-7 w-7 rounded-md bg-[var(--primary)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
      {orgInitials}
    </span>
  );

  const content = (
    <div className="flex-1 min-w-0 text-left">
      <p className="text-[12px] font-semibold text-foreground truncate">
        {orgName ?? "Organizzazione"}
      </p>
      {organization && (
        <p className="text-[11px] text-[var(--muted-foreground)] truncate">
          Piano {tierLabel(organization.subscriptionTier)}
        </p>
      )}
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="w-full flex items-center gap-2.5 px-2 py-1.5">
        {avatar}
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/organization"
      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors group"
    >
      {avatar}
      {content}
    </Link>
  );
}
