/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { z } from "zod";

/**
 * The one password rule, the same as the backend's PasswordPolicy: at least 8
 * characters and at most 72 bytes in UTF-8, the most BCrypt reads. An accented
 * letter takes 2 bytes, an emoji 4.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_TOO_SHORT = `La password deve contenere almeno ${PASSWORD_MIN_LENGTH} caratteri`;
export const PASSWORD_TOO_LONG =
  `La password è troppo lunga (massimo ${PASSWORD_MAX_BYTES} byte: le lettere accentate ne occupano 2)`;

/** UTF-8 length, counted by hand: TextEncoder is missing in some runtimes (jsdom). */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (const char of text) {
    // for...of yields whole code points, so codePointAt(0) is always defined.
    const code = char.codePointAt(0) as number;
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code < 0x10000) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

/** The message for the rule the password breaks, or null when it follows them all. */
export function passwordViolation(password: string): string | null {
  // Characters, not UTF-16 units: an emoji counts as one, as on the backend.
  if ([...password].length < PASSWORD_MIN_LENGTH) {
    return PASSWORD_TOO_SHORT;
  }
  if (utf8ByteLength(password) > PASSWORD_MAX_BYTES) {
    return PASSWORD_TOO_LONG;
  }
  return null;
}

/** A required password for zod forms; `message` is shown when it is missing. */
export function passwordSchema(message = "La password è obbligatoria") {
  return z.string({ message }).superRefine((value, ctx) => {
    const violation = passwordViolation(value);
    if (violation) {
      ctx.addIssue({ code: "custom", message: violation });
    }
  });
}
