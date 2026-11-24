/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * The session's inactivity timeout, on the user's side (OWASP ASVS 7.3.1,
 * docs/BUSINESS_RULES.md). The backend ends a session after 30 minutes without
 * a renewal; background requests (the notifications' polling) would renew it
 * forever, so what counts here is the user: a key, a click, a touch, a scroll.
 * Two minutes before the end a warning offers to stay signed in; at the end
 * the user is signed out. While the user is active the session is renewed at
 * most every ten minutes, so reading a long page without calling the API does
 * not let the backend's own timeout run out. Activity in any tab of the app
 * counts for all of them (localStorage, a timestamp only).
 */

export const IDLE_TIMEOUT_MS = 30 * 60_000;
export const IDLE_WARNING_MS = 28 * 60_000;
export const KEEP_ALIVE_EVERY_MS = 10 * 60_000;

const STORAGE_KEY = "bcm-last-activity";

/** What the tab should do now, given the last activity it knows of. */
export type IdleState = "active" | "warning" | "expired";

export function idleState(lastActivity: number, now: number): IdleState {
  const idle = now - lastActivity;
  if (idle >= IDLE_TIMEOUT_MS) return "expired";
  if (idle >= IDLE_WARNING_MS) return "warning";
  return "active";
}

/** Whether to renew the session now: the user is active and the last renewal is older than ten minutes. */
export function shouldKeepAlive(lastActivity: number, lastKeepAlive: number, now: number): boolean {
  return idleState(lastActivity, now) === "active" && now - lastKeepAlive >= KEEP_ALIVE_EVERY_MS;
}

/** The latest activity of this tab or any other one. */
export function latestActivity(ownActivity: number): number {
  try {
    const shared = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(shared) && shared > ownActivity ? shared : ownActivity;
  } catch {
    return ownActivity;
  }
}

/** Tells the other tabs that the user is active. */
export function shareActivity(at: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(at));
  } catch {
    // Storage unavailable (private mode): this tab still counts its own activity.
  }
}
