/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { isAxiosError } from "axios";

/**
 * Writes a failure to the browser console as status and message only (OWASP
 * Logging Cheat Sheet: no tokens or passwords in logs). An axios error logged
 * whole carries the request it came from: its Authorization header, the
 * access token, and its body, a password typed in a form.
 */
export function logError(context: string, error: unknown): void {
  console.error(context, describe(error));
}

function describe(error: unknown): string {
  if (isAxiosError(error)) {
    const body: unknown = error.response?.data;
    const message = (body as { message?: unknown } | null)?.message;
    const status = error.response?.status ?? "no response";
    return typeof message === "string" && message ? `${status}: ${message}` : `${status}: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
