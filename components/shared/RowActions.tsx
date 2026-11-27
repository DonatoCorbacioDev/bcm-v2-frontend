"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowActionsProps {
  /** The row's name, for the menu's label read out by screen readers. */
  readonly name: string;
  readonly onEdit?: () => void;
  readonly onDelete: () => void;
}

/**
 * A table row's actions: "Modifica", the everyday one, in sight; "Elimina"
 * one step away in the "⋯" menu, so a red word is not repeated on every row
 * and a delete is never one slip of the mouse away. The delete still asks
 * for confirmation in its own dialog.
 */
export function RowActions({ name, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-primary hover:text-primary text-xs px-2 dark:text-[var(--accent-foreground)] dark:hover:text-[var(--accent-foreground)]"
        >
          Modifica
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Altre azioni per ${name}`}>
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Elimina
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
