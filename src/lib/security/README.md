# Security Middleware

This directory contains security utilities for the AlphaWhale Hunter Screen, implementing comprehensive security headers and CSP (Content Security Policy) with nonce support.

## Overview

The security middleware automatically applies security headers to all responses, protecting against common web vulnerabilities including XSS, clickjacking, MIME sniffing, and more.

## Features

### 1. Content Security Policy (CSP)

Implements a strict CSP with per-request nonces to prevent XSS attacks:

- **Nonce-based inline scripts/styles**: Each request gets a unique nonce
- **No unsafe-inline/unsafe-eval in production**: Strict CSP enforcement
- **Allowlisted domains**: Only approved external resources can be loaded
- **Frame protection**: Prevents clickjacking with `frame-ancestors 'none'`

### 2. HTTP Strict Transport Security (HSTS)

Forces HTTPS connections in production:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 3. X-Content-Type-Options

Prevents MIME type sniffing:

```
X-Content-Type-Options: nosniff
```

### 4. X-Frame-Options

Prevents clickjacking:

```
X-Frame-Options: DENY
```

### 5. Permissions-Policy

Disables unnecessary browser features:

```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 6. Referrer-Policy

Controls referrer information:

```
Referrer-Policy: strict-origin-when-cross-origin
```

## Usage

### Middleware (Automatic)

The middleware is automatically applied to all routes via `middleware.ts` in the project root. No configuration needed.

### Using Nonces in Server Components

For inline scripts or styles that need CSP nonces:

```tsx
import { getNonce, getNonceAttr } from '@/lib/security/nonce';

export default function Page() {
  const nonce = getNonce();
  
  return (
    <>
      {/* Method 1: Using nonce directly */}
      <script nonce={nonce}>
        console.log('This script has a nonce');
      </script>
      
      {/* Method 2: Using spread operator */}
      <script {...getNonceAttr()}>
        console.log('This also has a nonce');
      </script>
      
      {/* Method 3: Inline styles */}
      <style nonce={nonce}>
        {`.custom-class { color: red; }`}
      </style>
    </>
  );
}
```

**Important**: `getNonce()` can only be called in Server Components. For Client Components, avoid inline scripts/styles or use external files.

## Development vs Production

### Development Mode

- Allows `unsafe-eval` and `unsafe-inline` for better DX
- Allows localhost connections
- No HSTS (HTTP is allowed)
- More permissive image sources

### Production Mode

- Strict CSP with nonces only
- No `unsafe-eval` or `unsafe-inline`
- HSTS enforced
- Limited to approved domains

## CSP Directives

### default-src

```
default-src 'self'
```

Default policy for all resource types.

### script-src

**Production:**
```
script-src 'self' 'nonce-{random}' vercel.live
```

**Development:**
```
script-src 'self' 'nonce-{random}' 'unsafe-eval' 'unsafe-inline' vercel.live
```

### style-src

**Production:**
```
style-src 'self' 'nonce-{random}'
```

**Development:**
```
style-src 'self' 'nonce-{random}' 'unsafe-inline'
```

### img-src

**Production:**
```
img-src 'self' data: blob:
```

**Development:**
```
img-src 'self' data: blob: https: http://localhost:*
```

All external images should be routed through `/api/img` proxy.

### connect-src

**Production:**
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co
```

**Development:**
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:* ws://localhost:*
```

### Other Directives

- `font-src 'self' data:`
- `frame-ancestors 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `object-src 'none'`
- `media-src 'self'`

## Testing

Run the test suite:

```bash
npm test src/__tests__/middleware.test.ts
npm test src/__tests__/lib/security/nonce.test.ts
```

## Troubleshooting

### CSP Violations

If you see CSP violations in the console:

1. **Inline scripts/styles**: Add nonce using `getNonce()`
2. **External resources**: Add domain to appropriate CSP directive
3. **Third-party scripts**: Ensure they're in the allowlist

### Headers Not Applied

1. Check middleware matcher configuration
2. Verify route is not excluded
3. Check for conflicting headers in API routes

### Nonce Not Available

1. Ensure you're in a Server Component
2. Check that middleware is running
3. Verify `x-nonce` header is present

## Security Considerations

1. **Never log nonces**: Nonces are security-sensitive
2. **Rotate regularly**: Nonces are per-request by design
3. **Avoid inline code**: Prefer external files when possible
4. **Test in production mode**: Development mode is more permissive
5. **Monitor CSP reports**: Set up CSP reporting endpoint

## Requirements Satisfied

- ✅ **Requirement 11.7**: CSP, HSTS, X-Content-Type-Options, X-Frame-Options
- ✅ **Requirement 11.8**: Per-request nonce generation
- ✅ **Requirement 11.11**: Strict CSP with no unsafe-inline/unsafe-eval in production

## Related Files

- `/middleware.ts` - Main middleware implementation
- `/src/lib/security/nonce.ts` - Nonce utilities
- `/src/lib/csp-config.ts` - CSP configuration (legacy, superseded by middleware)
- `/src/__tests__/middleware.test.ts` - Middleware tests
- `/src/__tests__/lib/security/nonce.test.ts` - Nonce utility tests

## References

- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
