# Security Policy

## 🔒 Supported Versions

The following versions of BCM Frontend are currently supported with security updates:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 2.0.x   | ✅ Yes             | Active Development |
| 1.0.x   | ❌ No              | Legacy (Angular version) |

---

## 🐛 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in this project, **please report it responsibly**.

### How to Report

**📧 Email:** donatocorbacio92@gmail.com

**Subject:** `[SECURITY] BCM Frontend - [Brief Description]`

**⚠️ DO NOT open a public GitHub issue for security vulnerabilities.**

### What to Include

Please provide as much information as possible:

1. **Description:** Clear explanation of the vulnerability
2. **Impact:** Potential consequences and severity assessment
3. **Steps to Reproduce:** Detailed reproduction steps
4. **Affected Components:** Files, pages, or features affected
5. **Suggested Fix:** If you have a solution (optional but appreciated)
6. **Your Contact Info:** For follow-up questions

### Example Report

```
Subject: [SECURITY] BCM Frontend - XSS in Contract Name Display

Description:
The ContractTable component renders contract names without sanitization,
allowing stored XSS attacks.

Impact:
- Malicious scripts execution in user browsers
- Session hijacking potential
- Phishing attacks

Steps to Reproduce:
1. Create contract with name: <script>alert('XSS')</script>
2. Navigate to /contracts page
3. Script executes in browser

Affected Components:
- components/contracts/ContractTable.tsx (line 145)

Suggested Fix:
Use DOMPurify or rely on React's built-in XSS protection
```

---

## 🕐 Response Timeline

| Stage | Timeline | Description |
|-------|----------|-------------|
| **Acknowledgment** | 48 hours | Confirmation that we received your report |
| **Initial Assessment** | 5 days | Severity evaluation and validation |
| **Fix Development** | 7-30 days | Depending on complexity and severity |
| **Public Disclosure** | After fix | Coordinated disclosure after patch release |

---

## 🛡️ Security Measures

### Current Implementation — verified against production (`bcm.donatocorbacio.dev`), not just code

#### Authentication & Session Management
- ✅ **Refresh token in an HTTP-only cookie** - never reachable from JS, `Secure` (prod) + `SameSite=Lax`, scoped to `/auth`
- ✅ **Access token kept in memory only** - never written to localStorage/sessionStorage; lost on reload by design, silently restored via the refresh cookie
- ✅ **Automatic token refresh** - seamless re-authentication on 401 and on page reload
- ✅ **Auto-logout on 401** - immediate redirect on unauthorized when refresh also fails
- ✅ **MFA (TOTP)** - implemented backend-side (`TwoFactorAuthService`), toggled from the profile page
- ✅ **HTTPS + HSTS** - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` set at the reverse proxy (see `bcm-v2-docker/Caddyfile`)

#### Content Security Policy
- ✅ **Real CSP, not a static header** - `proxy.ts` (Next.js 16's renamed `middleware.ts`) issues a fresh nonce per request and sets `script-src 'self' 'nonce-<value>' 'strict-dynamic'`, so Next's own inline bootstrap scripts work without `'unsafe-inline'`
- ✅ `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` - all set in `proxy.ts`, confirmed present on live response headers
- ✅ `X-Powered-By` header disabled (`poweredByHeader: false` in `next.config.ts`) - don't advertise the framework for free

#### Data Protection
- ✅ **XSS Prevention** - React's automatic escaping + the CSP above as a second layer
- ✅ **CSRF Protection** - SameSite cookie + Authorization-header-based auth (see backend `SecurityConfig` for the full rationale on why CSRF is disabled safely)
- ✅ **Input Validation** - Zod schemas with runtime checks
- ✅ **Form Validation** - React Hook Form with error boundaries
- ✅ **Type Safety** - 100% TypeScript coverage, strict mode

#### Dependency Hygiene
- ✅ **`npm audit`** - 0 known vulnerabilities as of the last check (2026-09-06); re-run before any release, not just on a fixed schedule
- ✅ **Dependabot** - configured at the `bcm-v2-docker` level for base image updates

#### Accessibility (relevant to security in the sense of not shipping broken auth flows)
- ✅ **Automated a11y coverage** - `@axe-core/playwright` runs against every dashboard page, all admin CRUD pages, and the legal pages (`e2e/a11y/*.spec.ts`)
- ✅ **Static a11y linting** - `eslint-config-next`'s `core-web-vitals` config bundles `jsx-a11y` rules

---

## ⚠️ Known Limitations

Real gaps, kept current — last reviewed 2026-09-06:

- ❌ **No self-service data export/deletion** - GDPR requests (access, portability, erasure) are handled manually via email today; see `/privacy` for the disclosed process. Fine for the current scale, worth automating before onboarding paying customers.
- ❌ **Session Timeout Warning** - No UI warning before JWT expiry, refresh just happens silently
- ❌ **No client-side security event logging** - Server-side audit log exists (`/audit-logs`); nothing client-side
- ❌ **Subresource Integrity (SRI)** - Not applicable today (no third-party `<script src>` tags loaded), revisit if one is ever added
- ❌ **No WAF / infra-level rate limiting** - Only the app-level Redis-backed rate limiter on `/auth/**` (backend); nothing in front of it at the Caddy/network layer

### Browser Security

- ⚠️ **Older Browsers** - Not tested on IE11 or legacy browsers
- ⚠️ **Browser Extensions** - May interfere with application behavior
- ⚠️ **Dev Tools Open** - Debug info visible in development mode

---

## 🔐 Security Best Practices

### For Developers

**When Contributing:**

1. **Never commit secrets**
   - No API keys in code
   - Use `.env.local` for all sensitive configs
   - Check `.gitignore` includes `.env.local`, `.env`
   - Rotate any accidentally committed secrets immediately

2. **Input validation**
   - Always validate on client AND server
   - Use Zod schemas for runtime validation
   - Sanitize before rendering (DOMPurify for HTML)
   - Set max lengths on all inputs

3. **Authentication/Authorization**
   - Never store tokens in localStorage/sessionStorage (XSS risk)
   - Refresh token: HTTP-only cookie only; access token: in-memory only (see `store/authStore.ts`)
   - Check auth state before sensitive operations
   - Handle 401/403 gracefully

4. **Dependencies**
   - Run `npm audit` before every PR
   - Update dependencies regularly
   - Review security advisories
   - Avoid packages with known vulnerabilities

5. **Data handling**
   - Don't log sensitive data to console
   - Mask passwords and PII in forms
   - Clear sensitive data on unmount
   - Use `type="password"` for password fields

**Code Review Checklist:**

- [ ] No hardcoded API keys or secrets
- [ ] No sensitive data in console.log
- [ ] Input validation on all forms
- [ ] Authentication checks on protected routes
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies have no critical vulnerabilities
- [ ] TypeScript strict mode passes
- [ ] ESLint security rules pass

---

## 🚀 Production Security Checklist

Before deploying to production:

### Infrastructure

- [x] **HTTPS Only** - Let's Encrypt via Caddy, auto-renewed
- [ ] **CDN / WAF / DDoS protection** - Not in front of the VM today; acceptable at current traffic, revisit if that changes
- [x] **Security Headers** - Set in `proxy.ts` (app-level) and `bcm-v2-docker/Caddyfile` (HSTS, edge-level)

### Application Configuration

- [x] **Environment Variables** - `.env` on the VM, gitignored, never committed (verified)
- [x] **API URL** - HTTPS only in `docker-compose.prod.yml`
- [x] **Cookie Flags** - `Secure` + `HttpOnly` + `SameSite=Lax`, scoped to `/auth`
- [x] **CSP Headers** - nonce-based, `strict-dynamic` (see above)
- [x] **HSTS** - enabled at the Caddy layer
- [x] **X-Frame-Options / X-Content-Type-Options / Referrer-Policy** - all set

### Code & Build

- [x] **Dependencies** - `npm audit`: 0 vulnerabilities (checked 2026-09-06)
- [ ] **Error Tracking** - No Sentry/LogRocket yet
- [ ] **Uptime Monitoring** - No external uptime alerting yet

Where the headers actually live, if you're checking: `proxy.ts` (CSP, frame-ancestors, permissions-policy, referrer-policy) and `bcm-v2-docker/Caddyfile` (HSTS, TLS termination, routing). Don't reintroduce a static header list in `next.config.ts` — it can't issue a per-request CSP nonce, which is why `proxy.ts` exists.

---

## 📚 Security Resources

### Standards & Guidelines

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [React Security Best Practices](https://react.dev/learn/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Tools

- **Dependency Audit:** `npm audit`, Snyk, GitHub Dependabot
- **Linting:** ESLint with security plugins
- **Testing:** React Testing Library, Playwright
- **Monitoring:** Sentry, LogRocket

### Training

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Web Security Academy](https://portswigger.net/web-security)

---

## 📞 Contact

**Security Contact:** donatocorbacio92@gmail.com  
**Project Maintainer:** Donato Corbacio  
**GitHub:** [@DonatoCorbacioDev](https://github.com/DonatoCorbacioDev)

**For non-security issues:** Please open a GitHub issue

---

## 📄 Disclosure Policy

We follow **coordinated disclosure**:

1. Reporter notifies us privately
2. We acknowledge and investigate
3. We develop and test a fix
4. We release a security patch
5. Public disclosure after users have time to update (typically 7-14 days)

**Hall of Fame:** Security researchers who responsibly disclose vulnerabilities will be acknowledged (with permission) in release notes and this document.

---

## 🆕 Security Updates

### Version 2.0.x (Current)

- **2026-09-06:** Full audit against production — CSP/HSTS/header claims corrected to match what's actually deployed, `next` bumped to 16.3.4 (0 known vulnerabilities, was 4 high), `X-Powered-By` disabled, HSTS added at the Caddy layer, this document rewritten to stop describing a 2025 snapshot
- **2025-02-05:** Initial security policy published
- **2025-02-05:** HTTP-only cookies implemented for JWT storage
- **2025-01-20:** TypeScript strict mode enabled
- **2025-01-15:** Zod validation schemas added

### Planned Enhancements

- [ ] Self-service GDPR data export/deletion
- [ ] Session timeout warning in the UI
- [ ] External uptime monitoring + error tracking

---

**Last Updated:** September 6, 2026
**Policy Version:** 2.0
