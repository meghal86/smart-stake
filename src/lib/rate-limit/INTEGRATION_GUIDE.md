# Rate Limiting Integration Guide

## Quick Start

The rate limiting middleware is ready to use in your API routes. Here's how to integrate it:

### 1. Basic Integration

```typescript
// app/api/hunter/opportunities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getIdentifierFromHeaders,
  isAuthenticatedFromHeaders,
  RateLimitError,
} from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // Extract identifier and check authentication
  const identifier = getIdentifierFromHeaders(req.headers);
  const isAuthenticated = isAuthenticatedFromHeaders(req.headers);

  // Check rate limit
  try {
    await checkRateLimit(identifier, isAuthenticated);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retry_after_sec: error.retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(error.retryAfter),
            'X-RateLimit-Limit': String(error.limit),
            'X-RateLimit-Remaining': String(error.remaining),
            'X-RateLimit-Reset': String(error.reset),
          },
        }
      );
    }
    throw error;
  }

  // Your API logic here...
  return NextResponse.json({ data: 'success' });
}
```

### 2. Using the Middleware Wrapper

```typescript
// app/api/hunter/opportunities/route.ts
import { withRateLimit } from '@/lib/rate-limit/example-usage';

async function handler(req: NextRequest) {
  // Your API logic here
  return NextResponse.json({ data: 'success' });
}

export const GET = withRateLimit(handler);
```

## Rate Limits

| User Type | Hourly Limit | Burst Limit |
|-----------|--------------|-------------|
| Anonymous | 60 req/hr | 10 req/10s |
| Authenticated | 120 req/hr | 10 req/10s |

## Response Headers

### Success Response
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1762387200000
```

### Rate Limited Response (429)
```
Retry-After: 3600
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1762387200000
```

## Error Response Format

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retry_after_sec": 3600
  }
}
```

## Testing

### Unit Tests
```bash
npm test -- src/__tests__/lib/rate-limit/index.test.ts --run
```

### Manual Testing

1. **Test Anonymous Rate Limit**:
```bash
# Make 61 requests without auth token
for i in {1..61}; do
  curl http://localhost:3000/api/hunter/opportunities
done
# Request 61 should return 429
```

2. **Test Authenticated Rate Limit**:
```bash
# Make 121 requests with auth token
for i in {1..121}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://localhost:3000/api/hunter/opportunities
done
# Request 121 should return 429
```

3. **Test Burst Limit**:
```bash
# Make 11 rapid requests
for i in {1..11}; do
  curl http://localhost:3000/api/hunter/opportunities &
done
wait
# Some requests should return 429
```

## Monitoring

Rate limit analytics are automatically tracked in Upstash. View metrics at:
https://console.upstash.com/

Metrics include:
- Total requests
- Rate limit hits
- Top identifiers
- Time-series data

## Troubleshooting

### Issue: All requests return 429

**Cause**: Redis connection issue or rate limit counters not resetting

**Solution**:
```typescript
import { resetRateLimit } from '@/lib/rate-limit';

// Reset for specific identifier
await resetRateLimit('192.168.1.1');
```

### Issue: Rate limits not working

**Cause**: Missing environment variables

**Solution**: Verify `.env` contains:
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Issue: Different limits than expected

**Cause**: Authentication detection not working

**Solution**: Verify Authorization header format:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Advanced Usage

### Custom Identifier

Use user ID instead of IP:

```typescript
import { checkRateLimit } from '@/lib/rate-limit';

const userId = req.headers.get('x-user-id');
const identifier = userId || getIdentifierFromHeaders(req.headers);

await checkRateLimit(identifier, !!userId);
```

### Check Status Without Consuming

```typescript
import { getRateLimitStatus } from '@/lib/rate-limit';

const status = await getRateLimitStatus(identifier, isAuthenticated);
console.log(`${status.remaining}/${status.limit} requests remaining`);
```

### Reset for Testing

```typescript
import { resetRateLimit } from '@/lib/rate-limit';

// In test setup
beforeEach(async () => {
  await resetRateLimit('test-identifier');
});
```

## Next Steps

1. Integrate into Task 12: `/api/hunter/opportunities`
2. Integrate into Task 13: `/api/guardian/summary`
3. Integrate into Task 14: `/api/eligibility/preview`
4. Add monitoring alerts for high rate limit hit rates
5. Consider implementing per-endpoint rate limits if needed

## Support

For issues or questions:
- See `src/lib/rate-limit/README.md` for detailed documentation
- Check `src/lib/rate-limit/example-usage.ts` for more examples
- Review tests in `src/__tests__/lib/rate-limit/index.test.ts`
