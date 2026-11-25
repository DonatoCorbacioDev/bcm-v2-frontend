"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadBlob } from "@/lib/download";
import { eventIcs, googleEventUrl, outlookEventUrl, type CalendarEvent } from "@/lib/calendarLinks";

interface AddToCalendarMenuProps {
  readonly event: CalendarEvent;
  /** Stable per contract and date, so a second import updates the event. */
  readonly uid: string;
  readonly label?: string;
  readonly size?: "sm" | "default";
}

/** One date in the user's own calendar: Google, Outlook, or an .ics file for Apple and the rest. */
export function AddToCalendarMenu({ event, uid, label = "Aggiungi al calendario", size = "sm" }: AddToCalendarMenuProps) {
  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size={size} className="bg-card">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => open(googleEventUrl(event))}>Google Calendar</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => open(outlookEventUrl(event))}>Outlook.com</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => open(outlookEventUrl(event, true))}>Outlook (Microsoft 365)</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => downloadBlob(new Blob([eventIcs(event, uid)], { type: "text/calendar;charset=utf-8" }), `${uid}.ics`)}
        >
          Apple Calendar e altri (file .ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
