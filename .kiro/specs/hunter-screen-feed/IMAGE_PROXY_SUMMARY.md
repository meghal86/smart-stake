# Image Proxy Implementation Summary

## Quick Reference

### Endpoint
```
GET /api/img?src=<url>&w=<width>&h=<height>&fit=<mode>&format=<format>
```

### Usage in Components
```typescript
import { createProxyImageUrl } from '@/lib/csp-config';

// In your component
const imageUrl = createProxyImageUrl(externalUrl, {
  width: 256,
  height: 256,
  format: 'webp',
});

<img src={imageUrl} alt="Logo" />
```

### Security Features
- ✅ Blocks localhost and private IPs
- ✅ Blocks cloud metadata services (AWS/GCP/Azure)
- ✅ Hostname allowlist enforcement
- ✅ EXIF data stripping
- ✅ 5MB file size limit
- ✅ 4K dimension limit
- ✅ 10 second timeout

### Test Results
```
✅ 54/54 tests passing
   - 26 unit tests
   - 5 API tests
   - 23 SSRF protection integration tests
```

### Files
- `src/lib/image-proxy.ts` - Core library
- `src/pages/api/img.ts` - API endpoint
- `src/lib/csp-config.ts` - CSP configuration
- `src/pages/api/img.README.md` - Full documentation

### Allowed Hostnames
- cdn.alphawhale.com
- images.alphawhale.com
- assets.alphawhale.com
- assets.coingecko.com
- raw.githubusercontent.com
- ipfs.io
- cloudflare-ipfs.com
- cdn.jsdelivr.net
- unpkg.com

### Migration Example

**Before:**
```tsx
<img src="https://assets.coingecko.com/logo.png" alt="Logo" />
```

**After:**
```tsx
import { createProxyImageUrl } from '@/lib/csp-config';

const url = createProxyImageUrl('https://assets.coingecko.com/logo.png', {
  width: 256,
  height: 256,
  format: 'webp',
});

<img src={url} alt="Logo" width={256} height={256} />
```

### CSP Configuration

Production CSP blocks direct external images:
```typescript
'img-src': ["'self'", 'data:', 'blob:']
```

All external images must go through `/api/img`.

### Error Handling

The proxy returns structured errors:
```json
{
  "error": {
    "code": "BLOCKED_HOSTNAME",
    "message": "Hostname example.com is not in the allowlist"
  }
}
```

Common error codes:
- `BLOCKED_HOSTNAME` - Not in allowlist
- `BLOCKED_IP` - Private IP address
- `FILE_TOO_LARGE` - Exceeds 5MB
- `TIMEOUT` - Request timeout
- `PROCESSING_ERROR` - Image processing failed

### Performance

- **Cache**: 1 year immutable
- **Format**: WebP by default (85% quality)
- **Optimization**: Automatic compression
- **CDN**: Fully cacheable

### Next Steps for Integration

1. Update OpportunityCard component to use proxy
2. Update protocol logo rendering
3. Test CSP enforcement
4. Monitor blocked requests
5. Add new domains to allowlist as needed

See `TASK_11A_COMPLETION.md` for full implementation details.
