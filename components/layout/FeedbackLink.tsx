/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

// The same public address as the privacy and cookie pages.
const FEEDBACK_EMAIL = "donatocorbacio92@gmail.com";

/** The mail the link opens: the page it was written from, and a question to start from. */
export function feedbackHref(pathname: string): string {
  const subject = "Parere su BCM";
  const body = `Pagina: ${pathname}\n\nCosa non ti è chiaro, o cosa miglioreresti?\n\n`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
