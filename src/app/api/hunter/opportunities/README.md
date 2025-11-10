# GET /api/hunter/opportunities

Main feed endpoint for the Hunter Screen that provides paginated, filtered opportunities with Guardian trust scores.

## Features

- ✅ Cursor-based pagination with snapshot consistency
- ✅ Comprehensive filtering (type, chains, trust, reward, urgency, difficulty)
- ✅ Rate limiting (60/hr anonymous, 120/hr authenticated)
- ✅ ETag support for 304 Not Modified responses
- ✅ Structured error responses with retry guidance
- ✅ API versioning for gradual rollouts
- ✅ Sponsored item capping (≤2 per 12 cards)
- ✅ Search functionality

## Request

### Endpoint

```
GET /api/hunter/opportunities
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query (searches title, protocol name, description) |
| `type` | string[] | - | Filter by opportunity types (airdrop, quest, staking, yield, points, loyalty, testnet) |
| `chains` | string[] | - | Filter by blockchain chains (ethereum, base, arbitrum, optimism, polygon, solana, avalanche) |
| `trust_min` | number | 80 | Minimum trust score (0-100) |
| `reward_min` | number | - | Minimum reward amount |
| `reward_max` | number | - | Maximum reward amount |
| `urgency` | string[] | - | Filter by urgency (ending_soon, new, hot) |
| `eligible` | boolean | - | Show only likely eligible opportunities |
| `difficulty` | string[] | - | Filter by difficulty (easy, medium, advanced) |
| `sort` | string | recommended | Sort order (recommended, ends_soon, highest_reward, newest, trust) |
| `cursor` | string | - | Pagination cursor from previous response |
| `mode` | string | - | Special modes (fixtures for testing) |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | No | Bearer token for authenticated requests (increases rate limit) |
| `If-None-Match` | No | ETag from previous response for 304 Not Modified support |

### Example Requests

**Basic request:**
```bash
curl https://api.alphawhale.com/api/hunter/opportunities
```

**With filters:**
```bash
curl "https://api.alphawhale.com/api/hunter/opportunities?type=airdrop&chains=ethereum&trust_min=85"
```

**With pagination:**
```bash
curl "https://api.alphawhale.com/api/hunter/opportunities?cursor=eyJyYW5rX3Njb3JlIjo4NS4..."
```

**With ETag (conditional request):**
```bash
curl -H "If-None-Match: \"abc123...\"" https://api.alphawhale.com/api/hunter/opportunities
```

**Authenticated request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.alphawhale.com/api/hunter/opportunities
```

## Response

### Success Response (200 OK)

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "slug": "example-opportunity",
      "title": "Example Airdrop",
      "description": "Participate in this airdrop...",
      "protocol": {
        "name": "Example Protocol",
        "logo": "https://example.com/logo.png"
      },
      "type": "airdrop",
      "chains": ["ethereum", "base"],
      "reward": {
        "min": 100,
        "max": 500,
        "currency": "USD",
        "confidence": "estimated"
      },
      "apr": null,
      "trust": {
        "score": 85,
        "level": "green",
        "last_scanned_ts": "2025-01-08T12:00:00Z",
        "issues": []
      },
      "urgency": "new",
      "difficulty": "easy",
      "eligibility_preview": {
        "status": "likely",
        "reasons": ["Wallet active on Ethereum", "Sufficient transaction history"]
      },
      "featured": false,
      "sponsored": false,
      "time_left_sec": 86400,
      "external_url": "https://example.com/airdrop",
      "badges": [
        { "type": "featured", "label": "Featured" }
      ],
      "status": "published",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-08T12:00:00Z",
      "published_at": "2025-01-01T00:00:00Z",
      "expires_at": "2025-01-15T00:00:00Z"
    }
  ],
  "cursor": "eyJyYW5rX3Njb3JlIjo4NS4...",
  "ts": "2025-01-08T12:00:00Z"
}
```

### Response Headers

| Header | Description |
|--------|-------------|
| `X-API-Version` | API version (e.g., "1.0.0") |
| `ETag` | Entity tag for cache validation |
| `Cache-Control` | Cache directives (public for anon, private for auth) |
| `Content-Type` | application/json |

### Not Modified Response (304)

When the `If-None-Match` header matches the current ETag, the server returns 304 with no body.

**Headers:**
- `ETag`: Current entity tag
- `X-API-Version`: API version

### Error Responses

#### Rate Limited (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retry_after_sec": 3600
  }
}
```

**Headers:**
- `Retry-After`: Seconds until rate limit resets
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

#### Bad Request (400)

```json
{
  "error": {
    "code": "BAD_FILTER",
    "message": "Invalid query parameters"
  }
}
```

#### Internal Error (500)

```json
{
  "error": {
    "code": "INTERNAL",
    "message": "An internal error occurred. Please try again later."
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `BAD_FILTER` | 400 | Invalid query parameters or cursor |
| `INTERNAL` | 500 | Internal server error |
| `UNAVAILABLE` | 503 | Service temporarily unavailable |
| `NOT_ALLOWED_GEO` | 403 | Geo-restricted content |
| `NOT_ALLOWED_KYC` | 403 | KYC verification required |

## Rate Limits

| User Type | Hourly Limit | Burst Limit |
|-----------|--------------|-------------|
| Anonymous | 60 requests/hour | 10 requests/10 seconds |
| Authenticated | 120 requests/hour | 10 requests/10 seconds |

Rate limits are enforced per IP address for anonymous users and per user ID for authenticated users.

## Caching

### Anonymous Users
- **Edge Cache**: 60 seconds with stale-while-revalidate for 300 seconds
- **Cache-Control**: `public, max-age=60, stale-while-revalidate=300`

### Authenticated Users
- **No Cache**: Personalized content is not cached
- **Cache-Control**: `private, no-cache, no-store, must-revalidate`

### ETag Support

The API generates an ETag for each response. Clients can include the `If-None-Match` header with the ETag value to receive a 304 Not Modified response if the content hasn't changed.

**Benefits:**
- Reduces bandwidth usage
- Improves client-side performance
- Maintains cache consistency

## Pagination

The API uses cursor-based pagination for stable, consistent results:

1. **First Request**: Omit the `cursor` parameter
2. **Subsequent Requests**: Use the `cursor` value from the previous response
3. **End of Results**: When `cursor` is `null`, there are no more pages

### Snapshot Consistency

Each pagination session uses a snapshot timestamp to ensure consistent results:
- All pages in a session see the same data state
- New opportunities published during pagination won't appear until a new session
- Prevents duplicates and missing items across pages

## Filtering

### Multiple Values

Array parameters (type, chains, urgency, difficulty) can be specified multiple times:

```bash
?type=airdrop&type=quest&chains=ethereum&chains=base
```

### Trust Levels

- **Green**: trust_score ≥ 80
- **Amber**: trust_score 60-79
- **Red**: trust_score < 60 (hidden by default)

### Sort Options

- `recommended`: Personalized ranking (default)
- `ends_soon`: Expiring soonest first
- `highest_reward`: Highest rewards first
- `newest`: Most recently published first
- `trust`: Highest trust scores first

## Testing

### Fixtures Mode

For testing and development, use `mode=fixtures` to get deterministic test data:

```bash
curl "https://api.alphawhale.com/api/hunter/opportunities?mode=fixtures"
```

This returns a consistent dataset with all opportunity types and edge cases.

## Requirements Mapping

This endpoint implements the following requirements:

- **1.7**: API response structure with items, cursor, and timestamp
- **1.8**: Cursor-based pagination with null termination
- **1.9**: ETag generation for cache validation
- **1.10**: 304 Not Modified support with If-None-Match
- **1.11**: API versioning via X-API-Version header
- **4.13**: Rate limiting for anonymous users (60/hr)
- **4.14**: Rate limiting for authenticated users (120/hr)
- **4.15**: Burst allowance (10 req/10s)
- **8.10**: Structured error responses with codes
- **8.11**: Retry-After header on 429 responses

## Related Documentation

- [Feed Query Service](../../../../lib/feed/README.md)
- [Rate Limiting](../../../../lib/rate-limit/README.md)
- [Cursor Pagination](../../../../lib/cursor.README.md)
- [Hunter Screen Types](../../../../types/hunter.ts)
- [Zod Schemas](../../../../schemas/hunter.ts)
