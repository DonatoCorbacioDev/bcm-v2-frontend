/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { isAxiosError } from "axios";

/**
 * The server's own message for a 409: a change made from an out-of-date copy
 * (someone else saved the same record meanwhile, optimistic locking) or a
 * duplicate value. Undefined for any other error, so the caller keeps its
 * generic message.
 */
export function conflictMessage(error: unknown): string | undefined {
  if (isAxiosError<{ message?: string }>(error) && error.response?.status === 409) {
    return error.response.data?.message || undefined;
  }
  return undefined;
}
