/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";

/**
 * The page shown in place of one that failed or does not exist. It never
 * shows the error itself (OWASP Error Handling Cheat Sheet): only what
 * happened, in words, and the way back.
 */
export function ErrorScreen({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {action}
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Vai alla dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
