import type { NextConfig } from "next";

// Security headers (CSP, X-Frame-Options, etc.) are set in middleware.ts
// instead of here — the CSP needs a fresh per-request nonce for Next.js's
// own inline scripts to work, and next.config.ts headers() only supports
// static values.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
