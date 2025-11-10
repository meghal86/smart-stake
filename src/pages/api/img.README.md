# Image Proxy API

## Overview

The `/api/img` endpoint provides SSRF-safe image proxying with automatic optimization, resizing, and EXIF stripping. All external images should be routed through this proxy to prevent security vulnerabilities and ensure consistent image delivery.

## Endpoint

```
GET /api/img
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `src` | string (URL) | Yes | - | Source image URL (must be absolute HTTP/HTTPS) |
| `w` | number | No | - | Width in pixels (max 3840) |
| `h` | number | No | - | Height in pixels (max 2160) |
| `fit` | enum | No | `cover` | Resize fit mode: `cover`, `contain`, `fill`, `inside`, `outside` |
| `format` | enum | No | `webp` | Output format: `webp`, `png`, `jpeg` |

## Security Features

### SSRF Protection

The proxy implements comprehensive SSRF (Server-Side Request Forgery) protection:

1. **Protocol Restriction**: Only HTTP/HTTPS URLs allowed
2. **Localhost Blocking**: Blocks `localhost`, `0.0.0.0`, `127.0.0.0/8`
3. **Private IP Blocking**: Blocks RFC1918 ranges:
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
4. **Link-Local Blocking**: Blocks `169.254.0.0/16` (AWS metadata service)
5. **IPv6 Protection**: Blocks `::1`, `fe80::/10`, `fc00::/7`, `fd00::/7`
6. **Authentication Blocking**: Rejects URLs with `@` character
7. **Path Traversal Blocking**: Rejects URLs with `..`
8. **Hostname Allowlist**: Only approved hostnames are allowed

### Allowed Hostnames

- `cdn.alphawhale.com`
- `images.alphawhale.com`
- `assets.alphawhale.com`
- `assets.coingecko.com`
- `raw.githubusercontent.com`
- `ipfs.io`
- `cloudflare-ipfs.com`
- `cdn.jsdelivr.net`
- `unpkg.com`

### Additional Security

- **File Size Limit**: Maximum 5MB
- **Dimension Limit**: Maximum 4K (3840x2160)
- **EXIF Stripping**: All metadata removed
- **Content Type Validation**: Only image/* content types accepted
- **Timeout Protection**: 10 second request timeout

## Usage Examples

### Basic Usage

```typescript
// Proxy an external image
const imageUrl = '/api/img?src=https://assets.coingecko.com/logo.png';

<img src={imageUrl} alt="Logo" />
```

### With Resizing

```typescript
// Resize to 256x256 with cover fit
const imageUrl = '/api/img?src=https://assets.coingecko.com/logo.png&w=256&h=256&fit=cover';

<img src={imageUrl} alt="Logo" width={256} height={256} />
```

### With Format Conversion

```typescript
// Convert to WebP for better compression
const imageUrl = '/api/img?src=https://assets.coingecko.com/logo.png&format=webp';

<img src={imageUrl} alt="Logo" />
```

### Using Helper Function

```typescript
import { createProxyImageUrl } from '@/lib/csp-config';

const imageUrl = createProxyImageUrl('https://assets.coingecko.com/logo.png', {
  width: 256,
  height: 256,
  fit: 'cover',
  format: 'webp',
});

<img src={imageUrl} alt="Logo" />
```

## Response Headers

```
Content-Type: image/webp (or image/png, image/jpeg)
Cache-Control: public, max-age=31536000, immutable
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## Error Responses

### 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid query parameters",
    "details": [...]
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "BLOCKED_HOSTNAME",
    "message": "Hostname example.com is not in the allowlist"
  }
}
```

### 413 Payload Too Large

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Image size exceeds 5MB limit"
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Failed to process image"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_URL` | URL format is invalid |
| `INVALID_PROTOCOL` | Protocol is not HTTP/HTTPS |
| `BLOCKED_HOSTNAME` | Hostname is not in allowlist or is blocked |
| `BLOCKED_IP` | IP address is in blocked range |
| `BLOCKED_AUTH` | URL contains authentication |
| `BLOCKED_TRAVERSAL` | URL contains path traversal |
| `INVALID_CONTENT_TYPE` | Response is not an image |
| `FILE_TOO_LARGE` | Image exceeds 5MB limit |
| `FETCH_FAILED` | Failed to fetch source image |
| `TIMEOUT` | Request timed out |
| `PROCESSING_ERROR` | Failed to process image |

## Performance

- **Caching**: Images are cached for 1 year (immutable)
- **Optimization**: Automatic compression and format conversion
- **CDN**: Responses are CDN-cacheable
- **Lazy Loading**: Use with `loading="lazy"` attribute

## CSP Integration

The image proxy is integrated with Content Security Policy to block direct external images:

```typescript
// Production CSP blocks direct external images
'img-src': ["'self'", 'data:', 'blob:']

// All external images must go through /api/img
```

## Testing

### Unit Tests

```bash
npm test src/__tests__/lib/image-proxy.test.ts
npm test src/__tests__/api/img.test.ts
```

### Integration Tests (SSRF Protection)

```bash
npm test src/__tests__/api/img.integration.test.ts
```

## Migration Guide

### Before (Direct External Images)

```tsx
<img src="https://assets.coingecko.com/logo.png" alt="Logo" />
```

### After (Via Proxy)

```tsx
import { createProxyImageUrl } from '@/lib/csp-config';

const imageUrl = createProxyImageUrl('https://assets.coingecko.com/logo.png', {
  width: 256,
  height: 256,
  format: 'webp',
});

<img src={imageUrl} alt="Logo" width={256} height={256} />
```

## Monitoring

Monitor the following metrics:

- Request rate and latency
- Error rate by error code
- Cache hit rate
- Image processing time
- Blocked requests by reason

## Security Considerations

1. **Never bypass the proxy** for external images in production
2. **Keep the allowlist minimal** - only add trusted domains
3. **Monitor blocked requests** for potential attacks
4. **Update allowlist carefully** - review each addition
5. **Test SSRF protection** regularly with integration tests

## Related Documentation

- [Hunter Screen Requirements](/.kiro/specs/hunter-screen-feed/requirements.md) - Requirements 11.1, 11.11
- [CSP Configuration](/src/lib/csp-config.ts) - Content Security Policy setup
- [Image Proxy Library](/src/lib/image-proxy.ts) - Core implementation
