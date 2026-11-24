/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import api, { refreshAccessToken } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  IDLE_TIMEOUT_MS,
  idleState,
  latestActivity,
  shareActivity,
  shouldKeepAlive,
} from "@/lib/idleSession";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACTIVITY_EVENTS = ["keydown", "mousedown", "touchstart", "scroll", "wheel"] as const;
const CHECK_EVERY_MS = 15_000;
/** Activity is written down at most this often: a scroll fires dozens of events a second. */
const RECORD_EVERY_MS = 5_000;

/**
 * Signs the user out after 30 minutes without input, warning two minutes
 * before (lib/idleSession.ts). Mounted once in the dashboard layout.
 */
/**
 * The session ended by inactivity: revoked on the server, forgotten here, and
 * a full page load to the login, which also drops every cached response.
 */
async function signOutForInactivity(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Signed out here even if the server could not be told.
  }
  useAuthStore.getState().clearAuth();
  window.location.assign("/login?reason=idle");
}

export function IdleSessionGuard() {
  // Set when the guard starts (below): the session was just restored or opened.
  const lastActivity = useRef(0);
  const lastKeepAlive = useRef(0);
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    let ended = false;
    lastActivity.current = Date.now();
    lastKeepAlive.current = lastActivity.current;

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastActivity.current < RECORD_EVERY_MS) return;
      lastActivity.current = now;
      shareActivity(now);
    };

    const check = () => {
      if (ended) return;
      const now = Date.now();
      const last = latestActivity(lastActivity.current);
      const state = idleState(last, now);
      if (state === "expired") {
        ended = true;
        setWarning(false);
        void signOutForInactivity();
        return;
      }
      setWarning(state === "warning");
      setSecondsLeft(Math.max(0, Math.ceil((last + IDLE_TIMEOUT_MS - now) / 1000)));
      if (shouldKeepAlive(last, lastKeepAlive.current, now)) {
        lastKeepAlive.current = now;
        // A failed renewal is the session ending: lib/api.ts already signs out on it.
        refreshAccessToken().catch(() => undefined);
      }
    };

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, recordActivity, { passive: true }));
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    return () => {
      ended = true;
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, recordActivity));
      window.clearInterval(timer);
    };
  }, []);

  const stay = () => {
    const now = Date.now();
    lastActivity.current = now;
    lastKeepAlive.current = now;
    shareActivity(now);
    setWarning(false);
    refreshAccessToken().catch(() => undefined);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Dialog open={warning} onOpenChange={(open) => { if (!open) stay(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sei ancora qui?</DialogTitle>
          <DialogDescription>
            Per sicurezza la sessione si chiude dopo 30 minuti di inattività. Uscita automatica tra{" "}
            {minutes}:{seconds}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={stay}>Resta collegato</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
