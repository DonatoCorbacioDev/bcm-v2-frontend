/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * Links that put BCM's dates in the user's own calendar. Two kinds:
 *
 * - Subscribing to the whole feed (CalendarFeedController's .ics, the URL
 *   from the Profile): the calendar app fetches it again by itself, so new
 *   contracts appear without doing anything.
 * - Adding one date (a contract's last day to cancel): a single all-day
 *   event, through the calendar's own "new event" page or an .ics file.
 *
 * Nothing is sent anywhere until the user clicks: these only build URLs and
 * files in the browser. What a link carries is what the user asked to add
 * (the contract number, the counterparty, the date).
 */

export interface CalendarEvent {
  readonly title: string;
  /** YYYY-MM-DD: an all-day event on that day. */
  readonly date: string;
  readonly details?: string;
}

function compact(iso: string): string {
  return iso.replaceAll("-", "");
}

/** The day after, YYYY-MM-DD: calendars take an all-day event's end as exclusive. */
function nextDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

// ── Subscribing to the feed ─────────────────────────────────────

export function googleSubscribeUrl(feedUrl: string): string {
  // Google's "add by URL" takes the feed as webcal:// in the cid parameter.
  const webcal = feedUrl.replace(/^https?:\/\//, "webcal://");
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
}

export function outlookSubscribeUrl(feedUrl: string, work = false): string {
  const host = work ? "outlook.office.com" : "outlook.live.com";
  return `https://${host}/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent("Scadenze BCM")}`;
}

/** Apple Calendar (and most desktop apps) subscribe when they open a webcal:// link. */
export function appleSubscribeUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//, "webcal://");
}

// ── Adding one date ─────────────────────────────────────────────

export function googleEventUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${compact(event.date)}/${compact(nextDay(event.date))}`,
    ...(event.details ? { details: event.details } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookEventUrl(event: CalendarEvent, work = false): string {
  const host = work ? "outlook.office.com" : "outlook.live.com";
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: event.date,
    enddt: nextDay(event.date),
    allday: "true",
    ...(event.details ? { body: event.details } : {}),
  });
  return `https://${host}/calendar/0/deeplink/compose?${params.toString()}`;
}

function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/**
 * A one-event .ics file, with a reminder a week before and one the day
 * before: what Apple Calendar and any other app import. The uid makes a
 * second import update the event instead of doubling it.
 */
export function eventIcs(event: CalendarEvent, uid: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const alarm = (trigger: string) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(event.title)}`, `TRIGGER:${trigger}`, "END:VALARM"];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BCM//Scadenze//IT",
    "BEGIN:VEVENT",
    `UID:${uid}@bcm`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(event.date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(event.date))}`,
    `SUMMARY:${icsText(event.title)}`,
    ...(event.details ? [`DESCRIPTION:${icsText(event.details)}`] : []),
    ...alarm("-P7D"),
    ...alarm("-P1D"),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
