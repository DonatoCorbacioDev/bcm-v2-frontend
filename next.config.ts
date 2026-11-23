/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import type { NextConfig } from "next";

// Security headers (CSP, X-Frame-Options, etc.) are set in proxy.ts
// instead of here — the CSP needs a fresh per-request nonce for Next.js's
// own inline scripts to work, and next.config.ts headers() only supports
// static values.
const nextConfig: NextConfig = {
  output: "standalone",
  // Don't advertise the framework to every visitor for free.
  poweredByHeader: false,
  // The one header every response needs, static files included (OWASP ASVS
  // 3.4.4): proxy.ts skips /_next/static, /_next/image and the favicon, so
  // their scripts and styles went out without it.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] }];
  },
};

export default nextConfig;
