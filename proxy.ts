import { NextRequest, NextResponse } from "next/server";

// A static CSP (set via next.config.ts headers()) breaks the App Router:
// Next.js injects its own inline bootstrap/hydration scripts on every page,
// which a plain script-src 'self' blocks outright (verified: login page
// never hydrates, no inputs become interactive). The documented fix is a
// per-request nonce issued here in middleware and threaded through to
// Next's own scripts via the response header — 'strict-dynamic' then trusts
// only scripts carrying that nonce, so no 'unsafe-inline' is needed.
function apiOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "";
  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

const API_ORIGIN = apiOrigin();

// next dev's Fast Refresh/HMR runtime uses eval() to apply hot updates —
// without 'unsafe-eval' it throws on every load and the whole client bundle
// fails to bootstrap (verified: no effects ever ran, no requests ever fired,
// the app was stuck on its initial loading state forever). Production builds
// don't use eval() for this, so this only relaxes the policy in dev.
const IS_DEV = process.env.NODE_ENV === "development";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${IS_DEV ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${API_ORIGIN ? ` ${API_ORIGIN}` : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and images; every actual page/route gets a nonce.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
