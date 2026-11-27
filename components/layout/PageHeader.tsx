/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  readonly title: ReactNode;
  /** One sentence on what the page is for: every page has one. */
  readonly description?: ReactNode;
  /** Where this page sits, for the pages reached from another (Impostazioni). */
  readonly back?: { readonly href: string; readonly label: string };
  /** The page's buttons, top right, level with the title. */
  readonly actions?: ReactNode;
}

/**
 * The same top on every page: where you are (a way back when the page sits
 * inside another), the title, one sentence, and the page's buttons on the
 * right, level with the title.
 */
export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
