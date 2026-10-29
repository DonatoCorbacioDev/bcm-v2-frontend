/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/** Saves a blob the API returned as a file, via a temporary link. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

/**
 * The file name from a Content-Disposition header
 * (`attachment; filename="bcm-export-acme-2026-10-29.zip"`), or null when
 * the header is missing or unreadable.
 */
export function filenameFromContentDisposition(header: string | null | undefined): string | null {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : null;
}
