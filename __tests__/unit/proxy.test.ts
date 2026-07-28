/**
 * @jest-environment node
 *
 * proxy.ts is Next.js Edge middleware built on the Fetch API (Request,
 * Response, Headers). jsdom (this project's default test environment)
 * doesn't provide those globals; Node's own runtime does.
 */
import { NextRequest } from 'next/server';

const ORIGINAL_ENV = { ...process.env };

function loadProxy() {
  // proxy.ts computes its module-level constants (API_ORIGIN, IS_DEV) once at
  // import time from process.env, so each variant needs a fresh module
  // instance loaded after the env vars for that scenario are set.
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/proxy') as typeof import('@/proxy');
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('proxy middleware', () => {
  it('sets a per-request nonce and the standard security headers', () => {
    const { proxy } = loadProxy();
    const request = new NextRequest('http://localhost:3000/dashboard');

    const response = proxy(request);

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('issues a different nonce on every call', () => {
    const { proxy } = loadProxy();
    const request = new NextRequest('http://localhost:3000/dashboard');

    const nonceOf = (csp: string | null) => csp?.match(/'nonce-([^']+)'/)?.[1];

    const first = nonceOf(proxy(request).headers.get('Content-Security-Policy'));
    const second = nonceOf(proxy(request).headers.get('Content-Security-Policy'));

    expect(first).toBeDefined();
    expect(first).not.toBe(second);
  });

  it("does not allow 'unsafe-eval' outside development", () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production' });
    const { proxy } = loadProxy();

    const csp = proxy(new NextRequest('http://localhost:3000/')).headers.get('Content-Security-Policy');

    expect(csp).not.toContain('unsafe-eval');
  });

  it("allows 'unsafe-eval' in development for Fast Refresh", () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' });
    const { proxy } = loadProxy();

    const csp = proxy(new NextRequest('http://localhost:3000/')).headers.get('Content-Security-Policy');

    expect(csp).toContain("'unsafe-eval'");
  });

  it('adds the API origin to connect-src when NEXT_PUBLIC_API_URL is set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api/v1';
    const { proxy } = loadProxy();

    const csp = proxy(new NextRequest('http://localhost:3000/')).headers.get('Content-Security-Policy');

    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it('falls back to connect-src \'self\' when NEXT_PUBLIC_API_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const { proxy } = loadProxy();

    const csp = proxy(new NextRequest('http://localhost:3000/')).headers.get('Content-Security-Policy');

    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toMatch(/connect-src 'self' \S/);
  });

  it('falls back to connect-src \'self\' when NEXT_PUBLIC_API_URL is malformed', () => {
    process.env.NEXT_PUBLIC_API_URL = 'not-a-valid-url';
    const { proxy } = loadProxy();

    const csp = proxy(new NextRequest('http://localhost:3000/')).headers.get('Content-Security-Policy');

    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toMatch(/connect-src 'self' \S/);
  });
});
