import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for protected routes
 * Handles authentication and redirects based on JWT token presence
 */
export function middleware(request: NextRequest) {
  // Get token from cookies (set by setToken in lib/auth.ts)
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes (accessible without authentication)
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If accessing public route
  if (isPublicRoute) {
    // Redirect to dashboard if already authenticated
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Root path: allow (will be handled by page.tsx redirect)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // For protected routes: redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // Preserve original URL for redirect after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists, allow access
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * WHITELIST approach: only run on specific paths
 */
export const config = {
  matcher: [
    /*
     * Match only application routes, not static assets
     * Explicitly list paths to protect
     */
    '/',
    '/dashboard/:path*',
    '/contracts/:path*',
    '/managers/:path*',
    '/settings/:path*',
  ],
};
