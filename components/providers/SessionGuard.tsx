"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useSessionGuard } from "@/hooks/useSessionGuard";

/** Mounted once at the app root — see useSessionGuard for why this exists. */
export function SessionGuard() {
  useSessionGuard();
  return null;
}
