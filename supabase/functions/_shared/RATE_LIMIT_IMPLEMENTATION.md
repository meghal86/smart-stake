# Rate Limiting Implementation for Wallet Edge Functions

## Overview

This document describes the rate limiting implementation for the multi-chain wallet system Edge Functions.

**Requirements Validated:**
- Requirement 11.4: Wallet mutation endpoints SHALL be rate limited at **10/min per user**
- Requirement 10.3: If rate limit exceeded, the API SHALL return **429** with `RATE_LIMITED` and retry guidance

## Implementation

### Rate Limit Utility (`rate-limit.ts`)

The rate limiting utility provides:

1. **`checkWalletRateLimit(userId, limit, windowSeconds)`**
   - Checks if a user has exceeded their rate limit
   - Uses Upstash Redis with sliding window algorithm
   - Default: 10 requests per 60 seconds per user
   - Throws `RateLimitError` if limit exceeded

2. **`RateLimitError`**
   - Custom error class with `retryAfter` property
   - Indicates how many seconds to wait before retrying

3. **`createRateLimitResponse(retryAfter)`**
   - Creates a 429 HTTP response with proper headers
   - Includes `Retry-After` header
   - Includes `retry_after_sec` in error body

### Integration Points

Rate limiting is integrated into all wallet mutation Edge Functions:

1. **`wallets-add-watch`** - Add a wallet to registry
2. **`wallets-remove`** - Remove a wallet from registry
3. **`wallets-remove-address`** - Remove all networks for an address
4. **`wallets-set-primary`** - Set a wallet as primary

### Implementation Pattern

Each Edge Function follows this pattern:

```typescript
import { checkWalletRateLimit, RateLimitError, createRateLimitResponse } from '../_shared/rate-limit.ts'

// After JWT validation
try {
  await checkWalletRateLimit(userId, 10, 60)
} catch (error) {
  if (error instanceof RateLimitError) {
    return createRateLimitResponse(error.retryAfter)
  }
  throw error
}
```

## Rate Limit Behavior

### Allowed Requests
- **10 requests per minute per user** (600 requests per hour)
- Sliding window algorithm ensures smooth rate limiting
- No sudden resets at minute boundaries

### Exceeded Requests
- Returns **HTTP 429** status code
- Error code: `RATE_LIMITED`
- Includes `Retry-After` header (seconds)
- Includes `retry_after_sec` in JSON response body

### Example Response

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retry_after_sec": 45
  }
}
```

Headers:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
Content-Type: application/json
```

## Configuration

### Environment Variables Required

```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Graceful Degradation

If Redis is not configured:
- Rate limiting is skipped with a warning log
- Requests are allowed to proceed
- This ensures the system remains functional even if Redis is unavailable

## Testing

### Property-Based Tests

Located in `src/lib/__tests__/wallet-rate-limit.test.ts`

**Property 11: Rate Limiting Enforcement**

Tests verify:
1. Requests 1-10 are allowed (status 200)
2. Requests 11+ are rejected (status 429)
3. Rate limit is per-user (different users have independent limits)
4. Response includes proper error structure
5. Response includes Retry-After header
6. Response includes retry_after_sec in error body

### Running Tests

```bash
npm test -- src/lib/__tests__/wallet-rate-limit.test.ts --run
```

## Monitoring

### Redis Metrics

Rate limit metrics are automatically tracked in Upstash Redis:
- Total requests
- Rate limit hits
- Top identifiers (users)
- Time-series data

View metrics at: https://console.upstash.com/

### Logging

Rate limit checks are logged in Edge Function execution logs:
- Successful checks: No log (normal operation)
- Failed checks: Error logged with user ID and retry-after time
- Redis errors: Logged with full error details

## Performance Impact

### Latency

- Rate limit check adds ~50-100ms per request (Redis call)
- Negligible impact on overall response time
- Redis calls are non-blocking

### Throughput

- Supports 10 requests/min per user
- Scales to thousands of concurrent users
- Redis sliding window is efficient and scalable

## Security Considerations

### User Identification

- Rate limiting is per authenticated user (user_id from JWT)
- Prevents one user from affecting another user's quota
- Ensures fair resource allocation

### Bypass Prevention

- Rate limiting is enforced server-side in Edge Functions
- Cannot be bypassed by client-side manipulation
- JWT validation ensures user identity

### DDoS Protection

- Per-user rate limiting prevents single user from overwhelming system
- Sliding window prevents burst attacks
- Graceful degradation if Redis unavailable

## Future Enhancements

### Potential Improvements

1. **Tiered Rate Limits**
   - Different limits for different user plans (free, pro, enterprise)
   - Currently: 10/min for all users

2. **Endpoint-Specific Limits**
   - Different limits for different operations
   - Currently: Same limit for all mutations

3. **Adaptive Rate Limiting**
   - Adjust limits based on system load
   - Temporarily increase limits during low-traffic periods

4. **Rate Limit Headers**
   - Include `X-RateLimit-Limit` header
   - Include `X-RateLimit-Remaining` header
   - Include `X-RateLimit-Reset` header

## Troubleshooting

### Issue: All requests return 429

**Cause:** Redis connection issue or rate limit counters not resetting

**Solution:**
1. Check Upstash Redis credentials in environment variables
2. Verify Redis connection in Upstash console
3. Check Redis key expiration settings

### Issue: Rate limits not working

**Cause:** Missing environment variables or Redis not configured

**Solution:**
1. Verify `UPSTASH_REDIS_REST_URL` is set
2. Verify `UPSTASH_REDIS_REST_TOKEN` is set
3. Check Edge Function logs for configuration errors

### Issue: Legitimate users getting rate limited

**Cause:** User making more than 10 requests per minute

**Solution:**
1. Verify user is not making excessive requests
2. Check for client-side retry loops
3. Consider increasing rate limit if needed

## References

- **Requirements:** Requirement 11.4, Requirement 10.3
- **Property:** Property 11: Rate Limiting Enforcement
- **Tests:** `src/lib/__tests__/wallet-rate-limit.test.ts`
- **Upstash Documentation:** https://upstash.com/docs/redis/features/ratelimiting
