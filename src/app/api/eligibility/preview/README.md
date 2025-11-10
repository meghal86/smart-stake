# GET /api/eligibility/preview

Eligibility preview endpoint for the Hunter Screen. Returns eligibility status, score, and reasons for a given wallet and opportunity.

## Overview

This endpoint provides eligibility previews for opportunities based on wallet signals. It implements Requirements 6.1-6.8 from the Hunter Screen specification.

**Features:**
- Accepts wallet address and opportunity ID
- Returns eligibility status, score, reasons, and cache expiry
- Handles missing wallet gracefully
- Database caching with 60-minute TTL
- Rate limiting (60/hr anon, 120/hr auth)
- Structured error responses

## Request

### Method
```
GET /api/eligibility/preview
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Ethereum wallet address (0x...) |
| `opportunityId` | string | Yes | Opportunity UUID |
| `chain` | string | Yes | Required chain for the opportunity (e.g., 'ethereum', 'base') |

### Example Request

```bash
curl "https://api.alphawhale.com/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response

### Success Response (200 OK)

```json
{
  "status": "likely",
  "score": 0.85,
  "reasons": [
    "Active on ethereum",
    "Wallet age 30+ days",
    "10+ transactions",
    "Holds tokens on chain"
  ],
  "cachedUntil": "2025-01-08T12:00:00.000Z",
  "ts": "2025-01-08T11:00:00.000Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Eligibility status: `likely`, `maybe`, `unlikely`, or `unknown` |
| `score` | number | Eligibility score (0-1 range) |
| `reasons` | string[] | Human-readable reasons explaining the determination |
| `cachedUntil` | string | ISO 8601 timestamp when the cached result expires |
| `ts` | string | ISO 8601 timestamp of the response |

### Status Labels

- **`likely`**: Score ≥ 0.7 - User is likely eligible
- **`maybe`**: Score 0.4-0.69 - User might be eligible
- **`unlikely`**: Score < 0.4 - User is unlikely to be eligible
- **`unknown`**: Unable to determine eligibility (with reason)

## Error Responses

### Missing Wallet (200 OK)

When wallet parameter is missing, returns unknown status gracefully:

```json
{
  "status": "unknown",
  "score": 0,
  "reasons": ["Wallet address is required to check eligibility"],
  "cachedUntil": "2025-01-08T12:00:00.000Z"
}
```

### Bad Request (400)

```json
{
  "error": {
    "code": "BAD_FILTER",
    "message": "Invalid Ethereum wallet address format"
  }
}
```

### Rate Limited (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retry_after_sec": 60
  }
}
```

**Response Headers:**
- `Retry-After`: Seconds until rate limit resets
- `X-RateLimit-Limit`: Total requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when rate limit resets

### Internal Error (500)

```json
{
  "error": {
    "code": "INTERNAL",
    "message": "An internal error occurred. Please try again later."
  }
}
```

## Rate Limiting

- **Anonymous users**: 60 requests per hour
- **Authenticated users**: 120 requests per hour
- **Burst allowance**: 10 requests per 10 seconds

Rate limits are enforced per IP address for anonymous users and per user ID for authenticated users.

## Caching

### Database Cache
- Results are cached in the `eligibility_cache` table
- Cache TTL: 60 minutes
- Cache key: `(opportunity_id, wallet_address)`

### HTTP Cache
- `Cache-Control: private, max-age=300, stale-while-revalidate=600`
- Private cache (wallet-specific data)
- 5-minute fresh cache
- 10-minute stale-while-revalidate window

## Scoring Algorithm

The eligibility score is calculated using weighted components:

| Component | Weight | Cap | Description |
|-----------|--------|-----|-------------|
| Chain Presence | 40% | - | Wallet has activity on required chain |
| Wallet Age | 25% | 30 days | Age of wallet in days |
| Transaction Count | 20% | 10 tx | Number of transactions |
| Holdings | 15% | - | Holds tokens on required chain |
| Allowlist Bonus | +5% | - | Wallet is on allowlist |

**Total possible score**: 1.05 (105%) with allowlist bonus

See `src/lib/eligibility.ts` for the detailed scoring implementation.

## Usage Examples

### JavaScript/TypeScript

```typescript
async function checkEligibility(
  wallet: string,
  opportunityId: string,
  chain: string
) {
  const params = new URLSearchParams({
    wallet,
    opportunityId,
    chain,
  });

  const response = await fetch(
    `/api/eligibility/preview?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}

// Usage
const preview = await checkEligibility(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  '123e4567-e89b-12d3-a456-426614174000',
  'ethereum'
);

console.log(`Status: ${preview.status}`);
console.log(`Score: ${preview.score}`);
console.log(`Reasons: ${preview.reasons.join(', ')}`);
```

### React Query

```typescript
import { useQuery } from '@tanstack/react-query';

function useEligibilityPreview(
  wallet: string | undefined,
  opportunityId: string,
  chain: string
) {
  return useQuery({
    queryKey: ['eligibility', opportunityId, wallet],
    queryFn: async () => {
      if (!wallet) {
        return {
          status: 'unknown',
          score: 0,
          reasons: ['Connect wallet to check eligibility'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
      }

      const params = new URLSearchParams({ wallet, opportunityId, chain });
      const response = await fetch(`/api/eligibility/preview?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch eligibility');
      }
      
      return await response.json();
    },
    enabled: !!opportunityId && !!chain,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 60 minutes
  });
}

// Usage in component
function OpportunityCard({ opportunity, wallet }) {
  const { data: eligibility, isLoading } = useEligibilityPreview(
    wallet,
    opportunity.id,
    opportunity.chains[0]
  );

  if (isLoading) {
    return <div>Checking eligibility...</div>;
  }

  return (
    <div>
      <EligibilityBadge status={eligibility.status} />
      <ul>
        {eligibility.reasons.map((reason, i) => (
          <li key={i}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Security Considerations

### Wallet Address Privacy

- Wallet addresses are normalized to lowercase for consistent caching
- Addresses are never logged in plain text in analytics
- Use salted hashes for any analytics tracking

### Input Validation

- Wallet address format validated (0x + 40 hex characters)
- Opportunity ID validated as UUID
- Chain name validated (alphanumeric + underscore/hyphen)

### Rate Limiting

- Prevents abuse and excessive API calls
- Different limits for authenticated vs anonymous users
- Burst allowance for legitimate usage spikes

## Performance Considerations

### Cache Hit Rate

Monitor cache hit rate to optimize TTL:

```sql
-- Query cache hit rate
SELECT 
  COUNT(*) FILTER (WHERE cached_at > NOW() - INTERVAL '1 hour') as recent_hits,
  COUNT(*) as total_entries,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cached_at > NOW() - INTERVAL '1 hour') / NULLIF(COUNT(*), 0), 2) as hit_rate_pct
FROM eligibility_cache
WHERE expires_at > NOW();
```

### Response Times

- **P50**: < 50ms (cache hit)
- **P95**: < 200ms (cache miss with blockchain query)
- **P99**: < 500ms

## Related Files

- `src/lib/eligibility-preview.ts` - Service implementation
- `src/lib/eligibility.ts` - Core scoring algorithm
- `src/__tests__/api/eligibility-preview.test.ts` - Unit tests
- `src/__tests__/api/eligibility-preview.integration.test.ts` - Integration tests

## Requirements Mapping

This endpoint implements the following requirements:

- **6.1**: Weighted scoring algorithm
- **6.2**: "Likely Eligible" label for score ≥ 0.7
- **6.3**: "Maybe Eligible" label for score 0.4-0.69
- **6.4**: "Unlikely Eligible" label for score < 0.4
- **6.5**: 1-2 reason bullets explaining determination
- **6.6**: 60-minute cache TTL per wallet/opportunity
- **6.7**: No direct wallet balance exposure
- **6.8**: Neutral "Unknown" label when eligibility cannot be computed
