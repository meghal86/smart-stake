# Task 13 Completion: /api/harvest/opportunities Endpoint

## Summary

Successfully implemented the `/api/harvest/opportunities` GET endpoint with comprehensive integration tests. The endpoint provides harvest opportunity discovery with filtering, pagination, rate limiting, and caching.

## API Endpoint Details

### Endpoint URL
```
GET /api/harvest/opportunities
```

### Base URL
- **Development**: `http://localhost:3000/api/harvest/opportunities`
- **Production**: `https://your-domain.com/api/harvest/opportunities`

### Authentication
**Required**: Yes - Bearer token in Authorization header

```bash
Authorization: Bearer <your-supabase-jwt-token>
```

## Implementation Details

### API Endpoint (`src/app/api/harvest/opportunities/route.ts`)

**Features Implemented:**
1. **Rate Limiting**: 60 req/hour for anonymous, 120 req/hour for authenticated users
2. **Query Parameter Validation**: Using Zod schema validation
3. **Cursor-based Pagination**: Efficient pagination with stable cursors
4. **Response Caching**: 5-minute cache with private cache control
5. **Authentication**: Requires authenticated user via Supabase
6. **Filtering Support**:
   - By wallet addresses
   - By minimum net benefit
   - By risk levels (LOW, MEDIUM, HIGH)
7. **Summary Statistics**: Aggregated metrics for all opportunities
8. **Performance Monitoring**: Processing time tracking with P95 target of 200ms

**Query Parameters:**
- `wallet` (array): Filter by wallet addresses
- `minBenefit` (number): Minimum net tax benefit threshold
- `riskLevel` (array): Filter by risk levels
- `cursor` (string): Pagination cursor
- `limit` (number): Results per page (1-100, default 20)

**Response Format:**
```typescript
{
  items: HarvestOpportunity[],
  cursor: string | null,
  ts: string, // ISO 8601 timestamp
  summary: {
    totalHarvestableLoss: number,
    estimatedNetBenefit: number,
    eligibleTokensCount: number,
    gasEfficiencyScore: 'A' | 'B' | 'C'
  }
}
```

**Error Handling:**
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (authentication required)
- 429: Rate Limited (with Retry-After header)
- 500: Internal Server Error

## API Usage Examples

### Basic Request (No Filters)

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "lotId": "lot-123",
      "userId": "user-456",
      "token": "ETH",
      "tokenLogoUrl": "https://example.com/eth-logo.png",
      "riskLevel": "LOW",
      "unrealizedLoss": 500.00,
      "remainingQty": 2.5,
      "gasEstimate": 15.00,
      "slippageEstimate": 5.00,
      "tradingFees": 2.50,
      "netTaxBenefit": 97.50,
      "guardianScore": 8.5,
      "executionTimeEstimate": "5-10 min",
      "confidence": 95,
      "recommendationBadge": "recommended",
      "metadata": {
        "walletName": "Main Wallet",
        "venue": "Uniswap",
        "reasons": ["High net benefit", "Low risk", "Good liquidity"]
      },
      "createdAt": "2025-02-01T10:00:00Z",
      "updatedAt": "2025-02-01T10:00:00Z"
    }
  ],
  "cursor": "eyJuZXRUYXhCZW5lZml0Ijo5Ny41fQ==",
  "ts": "2025-02-01T10:05:00.000Z",
  "summary": {
    "totalHarvestableLoss": 500.00,
    "estimatedNetBenefit": 97.50,
    "eligibleTokensCount": 1,
    "gasEfficiencyScore": "A"
  }
}
```

### Filtered Request (Multiple Parameters)

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?minBenefit=100&riskLevel=LOW&riskLevel=MEDIUM&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Filter by Wallet

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?wallet=0x1234...&wallet=0x5678..." \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Paginated Request (Using Cursor)

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?cursor=eyJuZXRUYXhCZW5lZml0Ijo5Ny41fQ==&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript/TypeScript Example (React Query)

```typescript
import { useQuery } from '@tanstack/react-query';
import type { OpportunitiesResponse } from '@/types/harvestpro';

interface UseOpportunitiesParams {
  wallets?: string[];
  minBenefit?: number;
  riskLevels?: ('LOW' | 'MEDIUM' | 'HIGH')[];
  cursor?: string;
  limit?: number;
}

export function useHarvestOpportunities(params: UseOpportunitiesParams = {}) {
  return useQuery<OpportunitiesResponse>({
    queryKey: ['harvest-opportunities', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.wallets) {
        params.wallets.forEach(wallet => searchParams.append('wallet', wallet));
      }
      if (params.minBenefit !== undefined) {
        searchParams.append('minBenefit', params.minBenefit.toString());
      }
      if (params.riskLevels) {
        params.riskLevels.forEach(level => searchParams.append('riskLevel', level));
      }
      if (params.cursor) {
        searchParams.append('cursor', params.cursor);
      }
      if (params.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      
      const response = await fetch(
        `/api/harvest/opportunities?${searchParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      
      return response.json();
    },
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
  });
}

// Usage in component
function HarvestDashboard() {
  const { data, isLoading, error } = useHarvestOpportunities({
    minBenefit: 100,
    riskLevels: ['LOW', 'MEDIUM'],
    limit: 20,
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading opportunities</div>;
  
  return (
    <div>
      <h2>Total Net Benefit: ${data.summary.estimatedNetBenefit}</h2>
      {data.items.map(opportunity => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
}
```

### Error Response Examples

**400 Bad Request:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid query parameters: limit must be between 1 and 100"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**429 Rate Limited:**
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
```
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706788800000
```

**500 Internal Server Error:**
```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Failed to fetch opportunities"
  }
}
```

### Integration Tests (`src/__tests__/api/harvest-opportunities.integration.test.ts`)

**Test Coverage (21 tests, all passing):**

1. **Query Parameter Validation** (7 tests)
   - Valid parameters acceptance
   - Negative minBenefit rejection
   - Limit boundary validation (< 1, > 100)
   - Multiple wallet filters
   - Multiple risk level filters
   - Invalid risk level rejection

2. **Rate Limiting** (2 tests)
   - Rate limit enforcement
   - Correct identifier and authentication status

3. **Pagination** (4 tests)
   - Cursor parameter acceptance
   - Invalid cursor format rejection
   - Default limit of 20
   - Custom limit respect

4. **Caching Behavior** (2 tests)
   - Cache-Control headers (private, max-age=300)
   - Processing time header (X-Processing-Time)

5. **Authentication** (1 test)
   - Authentication requirement

6. **Response Format** (2 tests)
   - Correct response structure
   - ISO 8601 timestamp format

7. **Error Handling** (2 tests)
   - Database error handling
   - Unexpected error handling

8. **Performance** (1 test)
   - Slow query warning (> 200ms)

## Requirements Validated

✅ **Requirement 2.5**: Complete scan within 10s for P95 (monitored via X-Processing-Time header)
✅ **Requirements 3.1-3.5**: Eligibility filtering support via query parameters
✅ **Requirements 4.1-4.5**: Net benefit calculation (returned in response)
✅ **Rate Limiting**: 60 req/hour enforced
✅ **Cursor Pagination**: Stable, efficient pagination
✅ **Response Caching**: 5-minute TTL

## Technical Decisions

1. **Edge Runtime**: Used for better performance and global distribution
2. **Cursor-based Pagination**: More efficient than offset-based for large datasets
3. **Base64 Cursor Encoding**: Simple, URL-safe cursor format
4. **Fetch N+1 Strategy**: Fetch limit+1 to determine if more results exist
5. **Gas Efficiency Grading**: Calculated from average gas percentage across opportunities
6. **Private Caching**: User-specific data requires private cache control

## Performance Characteristics

- **Target P95 Response Time**: < 200ms
- **Cache TTL**: 5 minutes (300 seconds)
- **Default Page Size**: 20 items
- **Max Page Size**: 100 items
- **Rate Limits**: 60/hour (anon), 120/hour (auth)

## Dependencies

This endpoint relies on:
- ✅ Task 1: Database schema (harvest_opportunities table)
- ✅ Task 2: FIFO cost basis calculation
- ✅ Task 3: Opportunity detection
- ✅ Task 4: Eligibility filtering
- ✅ Task 5: Net benefit calculation
- ✅ Task 6: Guardian adapter
- ✅ Task 7: Wallet connection layer
- ✅ Task 9: Price oracle integration

## Next Steps

This endpoint is now ready to be consumed by:
- Task 11: HarvestOpportunityCard component
- Task 10: HarvestPro dashboard UI

## Quick Reference

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string[] | No | - | Filter by wallet addresses (can specify multiple) |
| `minBenefit` | number | No | - | Minimum net tax benefit in USD |
| `riskLevel` | enum[] | No | - | Filter by risk levels: LOW, MEDIUM, HIGH (can specify multiple) |
| `cursor` | string | No | - | Pagination cursor from previous response |
| `limit` | number | No | 20 | Results per page (1-100) |

### Response Headers

| Header | Description |
|--------|-------------|
| `Cache-Control` | `private, max-age=300, s-maxage=300` (5 minutes) |
| `X-Processing-Time` | Request processing time in milliseconds |
| `X-RateLimit-Limit` | Maximum requests allowed per hour |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Timestamp when rate limit resets |
| `Retry-After` | Seconds to wait before retrying (on 429 only) |

### Gas Efficiency Grades

| Grade | Description | Gas Cost % of Loss |
|-------|-------------|-------------------|
| A | Excellent | < 5% |
| B | Good | 5-15% |
| C | Poor | > 15% |

### Risk Levels

| Level | Guardian Score | Description |
|-------|---------------|-------------|
| LOW | ≥ 7 | Safe to harvest |
| MEDIUM | 4-6 | Moderate risk |
| HIGH | ≤ 3 or low liquidity | High risk, proceed with caution |

## Files Created

1. `src/app/api/harvest/opportunities/route.ts` - Main API endpoint
2. `src/__tests__/api/harvest-opportunities.integration.test.ts` - Integration tests

## Test Results

```
✓ 21 tests passed
✓ 0 tests failed
✓ Duration: ~600ms
```

All integration tests are passing, validating:
- Query parameter validation
- Rate limiting enforcement
- Pagination functionality
- Caching behavior
- Authentication requirements
- Response format correctness
- Error handling
- Performance monitoring
