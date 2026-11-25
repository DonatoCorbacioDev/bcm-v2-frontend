/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

export default function KPICardSkeleton() {
  return (
    // Same size as KPICard: compact on phones, icon from the sm breakpoint.
    <div className="bg-card rounded-xl border border-border shadow-sm border-l-4 border-l-muted p-3 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 w-full max-w-28 bg-muted rounded" />
          <div className="h-8 w-12 bg-muted rounded mt-2 sm:h-9 sm:w-16 sm:mt-3" />
        </div>
        <div className="hidden w-12 h-12 bg-muted rounded-xl sm:block" />
      </div>
    </div>
  );
}
