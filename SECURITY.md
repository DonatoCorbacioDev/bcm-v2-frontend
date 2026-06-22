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

### Current Implementation

#### Authentication & Session Management
- ✅ **Refresh token in an HTTP-only cookie** - never reachable from JS, `Secure` (prod) + `SameSite=Lax`, scoped to `/auth`
- ✅ **Access token kept in memory only** - never written to localStorage/sessionStorage; lost on reload by design, silently restored via the refresh cookie
- ✅ **Automatic token refresh** - seamless re-authentication on 401 and on page reload
- ✅ **Auto-logout on 401** - immediate redirect on unauthorized when refresh also fails
- ✅ **HTTPS enforcement** - production deployment best practice

#### Data Protection
- ✅ **XSS Prevention** - React's automatic escaping
- ✅ **CSRF Protection** - SameSite cookie attribute
- ✅ **Input Validation** - Zod schemas with runtime checks
- ✅ **Form Validation** - React Hook Form with error boundaries
- ✅ **Type Safety** - 100% TypeScript coverage

#### Network Security
- ✅ **HTTPS API Calls** - Axios configured for secure connections
- ✅ **Request Interceptors** - Automatic JWT attachment
- ✅ **Error Handling** - No sensitive data in error messages
- ✅ **CORS-compliant** - Respects backend CORS policies

#### Code Quality
- ✅ **TypeScript strict mode** - Maximum type safety
- ✅ **ESLint security rules** - Automatic vulnerability detection
- ✅ **No inline scripts** - Content Security Policy ready
- ✅ **Dependency audit** - Regular `npm audit` checks

---

## ⚠️ Known Limitations

This is a **portfolio/demonstration project**. The following security considerations should be addressed before production use:

### Not Yet Implemented

- ❌ **Content Security Policy (CSP)** - No CSP headers configured
- ❌ **Subresource Integrity (SRI)** - External scripts not hashed
- ❌ **Rate Limiting** - No client-side throttling
- ❌ **Session Timeout Warning** - No UI warning before JWT expiry
- ❌ **MFA Support** - Not implemented
- ❌ **Audit Logging** - No client-side security event logging
- ❌ **Input Sanitization Library** - Relies on React only (consider DOMPurify)
- ❌ **Biometric Authentication** - Not supported

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

- [ ] **HTTPS Only** - Valid SSL/TLS certificate (Let's Encrypt, Cloudflare)
- [ ] **CDN** - Use Vercel, Cloudflare, or similar for DDoS protection
- [ ] **WAF (Web Application Firewall)** - Block common attacks
- [ ] **Rate Limiting** - Cloudflare or API Gateway level
- [ ] **DDoS Protection** - Infrastructure-level protection
- [ ] **Security Headers** - Configure in next.config.js or CDN

### Application Configuration

- [ ] **Environment Variables** - Use platform secrets (Vercel, Netlify)
- [ ] **API URL** - HTTPS backend endpoint only
- [ ] **Cookie Flags** - `Secure=true`, `HttpOnly=true`, `SameSite=Strict`
- [ ] **CSP Headers** - Content Security Policy configured
- [ ] **HSTS** - HTTP Strict Transport Security enabled
- [ ] **X-Frame-Options** - Prevent clickjacking
- [ ] **X-Content-Type-Options** - Prevent MIME sniffing
- [ ] **Referrer-Policy** - Limit referrer information

### Code & Build

- [ ] **Source Maps** - Disabled in production build
- [ ] **Console Logs** - Remove debug statements
- [ ] **Error Boundaries** - Catch and handle errors gracefully
- [ ] **Dependencies** - No critical/high vulnerabilities (`npm audit`)
- [ ] **Minification** - Production build optimized
- [ ] **Tree Shaking** - Unused code removed

### Monitoring & Response

- [ ] **Error Tracking** - Sentry, LogRocket, or similar
- [ ] **Analytics** - Privacy-respecting analytics (Plausible, Fathom)
- [ ] **Uptime Monitoring** - Alert on downtime
- [ ] **Performance Monitoring** - Core Web Vitals tracking
- [ ] **Incident Response Plan** - Documented procedures

---

## 🛡️ Security Headers Configuration

Add to `next.config.ts` for production:

```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://your-api-domain.com"
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

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

- **2025-02-05:** Initial security policy published
- **2025-02-05:** HTTP-only cookies implemented for JWT storage
- **2025-01-20:** TypeScript strict mode enabled
- **2025-01-15:** Zod validation schemas added

### Planned Enhancements

- [ ] Content Security Policy headers (Q2 2025)
- [ ] Session timeout warnings (Q2 2025)
- [ ] Enhanced error boundaries (Q2 2025)
- [ ] Security audit with OWASP ZAP (Q3 2025)

---

**Last Updated:** February 5, 2026  
**Policy Version:** 1.0
