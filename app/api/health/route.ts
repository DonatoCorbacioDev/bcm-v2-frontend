/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
