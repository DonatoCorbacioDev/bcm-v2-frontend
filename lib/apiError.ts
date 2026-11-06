/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { isAxiosError } from "axios";

/**
 * The backend's own error message, or the fallback. Also reads it from a Blob
 * body, which is what a failed file download (SEPA XML, exports) returns.
 */
export async function apiErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (!isAxiosError(error)) return fallback;
  if (error.response?.status === 429) return "Troppi tentativi, riprova tra un minuto";
  const data: unknown = error.response?.data;
  try {
    const body = data instanceof Blob ? JSON.parse(await data.text()) : data;
    const message = (body as { message?: unknown } | null)?.message;
    return typeof message === "string" && message ? message : fallback;
  } catch {
    return fallback;
  }
}
