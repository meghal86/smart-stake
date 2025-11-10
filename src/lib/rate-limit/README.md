# Rate Limiting Module

This module provides rate limiting functionality for the Hunter Screen API using Upstash Redis with sliding window algorithm.

## Features

- **Sliding Window Algorithm**: Smooth rate limiting without sudden resets
- **Dual Rate Limits**: Different limits for authenticated vs anonymous users
- **Burst Protection**: Additional burst limit to prevent rapid-fire requests
- **Retry-After Support**: Proper HTTP 429 responses with retry timing
- **Analytics**: Built-in analytics for monitoring rate limit hits

## Rate Limits

### Anonymous Users
- **Hourly Limit**: 60 requests per hour
- **Burst Limit**: 10 requests per 10 seconds

### Authenticated Users
- **Hourly Limit**: 120 requests per hour
- **Burst Limit**: 10 requests per 10 seconds

## Usage

### Basic Usage

```typescript
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';

try {
  const result = await checkRateLimit('user-ip-address', false);
  console.log(`Remaining: ${result.remaining}/${result.limit}`);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  }
}
```

### In API Routes (Next.js)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { 
  checkRateLimit, 
  getIdentifierFromHeaders,
  isAuthenticatedFromHeaders,
  RateLimitError 
} from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const identifier = getIdentifierFromHeaders(req.headers);
  const isAuthenticated = isAuthenticatedFromHeaders(req.headers);

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

  // Continue with request handling...
}
```

### Check Status Without Consuming

```typescript
import { getRateLimitStatus } from '@/lib/rate-limit';

const status = await getRateLimitStatus('user-ip-address', true);
console.log(`Can make ${status.remaining} more requests`);
```

### Reset Rate Limit (Testing/Admin)

```typescript
import { resetRateLimit } from '@/lib/rate-limit';

await resetRateLimit('user-ip-address');
```

## Configuration

Rate limiting requires Upstash Redis credentials in environment variables:

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

## Error Handling

The module throws `RateLimitError` when limits are exceeded:

```typescript
class RateLimitError extends Error {
  limit: number;        // Total allowed requests
  reset: number;        // Timestamp when limit resets
  remaining: number;    // Requests remaining (always 0 when thrown)
  retryAfter: number;   // Seconds until retry is allowed
}
```

## Testing

See `src/__tests__/lib/rate-limit/index.test.ts` for comprehensive test coverage.

## Requirements Satisfied

- **4.13**: Anonymous users limited to 60 requests/hour
- **4.14**: Authenticated users limited to 120 requests/hour
- **4.15**: Burst allowance of 10 requests per 10 seconds
- **8.6**: Rate limiting enforcement
- **8.11**: Retry-After header on 429 responses

## Architecture

```
┌─────────────────┐
│   API Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ getIdentifier   │ ← Extract IP/User ID
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ checkRateLimit  │ ← Check burst + hourly
└────────┬────────┘
         │
         ├─ Success ──────────────────┐
         │                            │
         └─ Failure ──────────────────┤
                                      │
                                      ▼
                            ┌─────────────────┐
                            │ RateLimitError  │
                            └─────────────────┘
```

## Performance

- **Latency**: ~10-20ms per check (Redis RTT)
- **Accuracy**: Sliding window provides smooth, accurate limiting
- **Scalability**: Upstash Redis handles millions of requests

## Monitoring

Rate limit analytics are automatically tracked in Upstash. View metrics in your Upstash dashboard:
- Total requests
- Rate limit hits
- Top identifiers
- Time-series data
