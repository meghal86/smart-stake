# HarvestPro Opportunities API Documentation

**Version:** 1.0  
**Last Updated:** February 2025  
**Status:** Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Endpoint Reference](#endpoint-reference)
5. [Request Examples](#request-examples)
6. [Response Format](#response-format)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Best Practices](#best-practices)
10. [Code Examples](#code-examples)
11. [Troubleshooting](#troubleshooting)
12. [Support](#support)

---

## Overview

The HarvestPro Opportunities API provides access to tax-loss harvesting opportunities for cryptocurrency portfolios. This RESTful API allows you to:

- Retrieve eligible harvest opportunities with detailed metrics
- Filter opportunities by wallet, risk level, and net benefit
- Paginate through large result sets efficiently
- Access aggregated summary statistics

### Key Features

✅ **Real-time Opportunity Detection** - Get up-to-date harvest opportunities  
✅ **Advanced Filtering** - Filter by wallet, risk level, and minimum benefit  
✅ **Cursor-based Pagination** - Efficient pagination for large datasets  
✅ **Rate Limiting** - Fair usage with 60-120 requests per hour  
✅ **Response Caching** - 5-minute cache for optimal performance  
✅ **Comprehensive Metrics** - Net benefit, gas estimates, risk scores, and more

---

## Getting Started

### Base URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://your-domain.com/api/harvest/opportunities` |
| **Staging** | `https://staging.your-domain.com/api/harvest/opportunities` |
| **Development** | `http://localhost:3000/api/harvest/opportunities` |

### Prerequisites

Before using this API, you need:

1. **Active Account** - A registered user account
2. **Authentication Token** - A valid JWT token from Supabase authentication
3. **Connected Wallets** - At least one wallet or CEX account connected to your profile

---

## Authentication

### Required Header

All requests must include a Bearer token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting Your Token

**Option 1: From Supabase Client (JavaScript/TypeScript)**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// After user signs in
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

**Option 2: From Browser (Development)**
```javascript
// In browser console after logging in
const token = localStorage.getItem('supabase.auth.token');
```

### Token Expiration

- Tokens expire after 1 hour by default
- Refresh tokens before expiration to maintain access
- Handle 401 errors by refreshing the token

---

## Endpoint Reference

### GET /api/harvest/opportunities

Retrieve harvest opportunities with optional filtering and pagination.

#### HTTP Method
```
GET
```

#### Query Parameters

| Parameter | Type | Required | Default | Constraints | Description |
|-----------|------|----------|---------|-------------|-------------|
| `wallet` | string[] | No | - | Valid wallet addresses | Filter by specific wallet addresses. Can be specified multiple times. |
| `minBenefit` | number | No | - | ≥ 0 | Minimum net tax benefit in USD. Only returns opportunities above this threshold. |
| `riskLevel` | enum[] | No | - | LOW, MEDIUM, HIGH | Filter by risk levels. Can be specified multiple times. |
| `cursor` | string | No | - | Base64 encoded | Pagination cursor from previous response. |
| `limit` | number | No | 20 | 1-100 | Number of results per page. |

#### Response Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Returns opportunities |
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Missing or invalid token |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Server error |

#### Response Headers

| Header | Description |
|--------|-------------|
| `Cache-Control` | `private, max-age=300, s-maxage=300` |
| `X-Processing-Time` | Request processing time in milliseconds |
| `X-RateLimit-Limit` | Maximum requests per hour |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |
| `Retry-After` | Seconds to wait (only on 429 errors) |

---

## Request Examples

### Example 1: Basic Request (No Filters)

Retrieve the first 20 opportunities with default sorting (by net benefit, descending).

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Filter by Minimum Benefit

Get opportunities with at least $100 net benefit.

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?minBenefit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Filter by Risk Level

Get only LOW and MEDIUM risk opportunities.

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?riskLevel=LOW&riskLevel=MEDIUM" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Filter by Wallet

Get opportunities from specific wallets.

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?wallet=0x1234567890abcdef&wallet=0xfedcba0987654321" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 5: Combined Filters with Custom Limit

Get LOW risk opportunities with minimum $50 benefit, 50 results per page.

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?minBenefit=50&riskLevel=LOW&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 6: Pagination (Next Page)

Use the cursor from a previous response to get the next page.

```bash
curl -X GET "https://your-domain.com/api/harvest/opportunities?cursor=eyJuZXRUYXhCZW5lZml0IjoxMjMuNDV9&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "lotId": "lot-abc123",
      "userId": "user-xyz789",
      "token": "ETH",
      "tokenLogoUrl": "https://assets.example.com/tokens/eth.png",
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
        "reasons": [
          "High net benefit",
          "Low risk",
          "Good liquidity"
        ]
      },
      "createdAt": "2025-02-01T10:00:00.000Z",
      "updatedAt": "2025-02-01T10:00:00.000Z"
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

### Response Fields

#### Root Level

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Array of harvest opportunity objects |
| `cursor` | string\|null | Pagination cursor for next page (null if no more results) |
| `ts` | string | ISO 8601 timestamp of response generation |
| `summary` | object | Aggregated statistics for all opportunities |

#### Opportunity Object (`items[]`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique opportunity identifier (UUID) |
| `lotId` | string | Reference to the source lot |
| `userId` | string | User ID who owns this opportunity |
| `token` | string | Token symbol (e.g., "ETH", "BTC") |
| `tokenLogoUrl` | string\|null | URL to token logo image |
| `riskLevel` | enum | Risk classification: "LOW", "MEDIUM", "HIGH" |
| `unrealizedLoss` | number | Absolute value of loss in USD |
| `remainingQty` | number | Quantity of tokens available to harvest |
| `gasEstimate` | number | Estimated gas cost in USD |
| `slippageEstimate` | number | Estimated slippage cost in USD |
| `tradingFees` | number | Estimated trading fees in USD |
| `netTaxBenefit` | number | Net benefit after all costs (USD) |
| `guardianScore` | number | Security risk score (0-10, higher is safer) |
| `executionTimeEstimate` | string\|null | Estimated execution time (e.g., "5-10 min") |
| `confidence` | number | Confidence level in estimates (0-100) |
| `recommendationBadge` | enum | "recommended", "not-recommended", "high-benefit", "gas-heavy", "guardian-flagged" |
| `metadata` | object | Additional contextual information |
| `createdAt` | string | ISO 8601 timestamp of creation |
| `updatedAt` | string | ISO 8601 timestamp of last update |

#### Metadata Object

| Field | Type | Description |
|-------|------|-------------|
| `walletName` | string | Human-readable wallet name |
| `venue` | string | Exchange or DEX name (e.g., "Uniswap", "Binance") |
| `reasons` | string[] | Array of reasons why this is a good opportunity |

#### Summary Object

| Field | Type | Description |
|-------|------|-------------|
| `totalHarvestableLoss` | number | Sum of all unrealized losses (USD) |
| `estimatedNetBenefit` | number | Sum of all net benefits (USD) |
| `eligibleTokensCount` | number | Number of unique tokens with opportunities |
| `gasEfficiencyScore` | enum | Overall gas efficiency: "A", "B", or "C" |

### Gas Efficiency Grades

| Grade | Description | Average Gas Cost |
|-------|-------------|------------------|
| **A** | Excellent | < 5% of loss |
| **B** | Good | 5-15% of loss |
| **C** | Poor | > 15% of loss |

### Risk Level Classifications

| Level | Guardian Score | Liquidity | Description |
|-------|---------------|-----------|-------------|
| **LOW** | ≥ 7.0 | High | Safe to harvest, low risk |
| **MEDIUM** | 4.0 - 6.9 | Medium | Moderate risk, review carefully |
| **HIGH** | ≤ 3.0 or Low liquidity | Low | High risk, proceed with caution |

---

## Error Handling

### Error Response Format

All errors follow this consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "retry_after_sec": 60
  }
}
```

### Error Codes

#### 400 Bad Request

Invalid query parameters or malformed request.

**Example:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid query parameters: limit must be between 1 and 100"
  }
}
```

**Common Causes:**
- `limit` outside range 1-100
- Negative `minBenefit`
- Invalid `riskLevel` value
- Malformed `cursor`

#### 401 Unauthorized

Missing or invalid authentication token.

**Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Common Causes:**
- Missing Authorization header
- Expired JWT token
- Invalid token format
- Token for different environment

**Solution:** Refresh your authentication token and retry.

#### 429 Too Many Requests

Rate limit exceeded.

**Example:**
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
```http
Retry-After: 60
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706788800000
```

**Solution:** Wait for the time specified in `retry_after_sec` or `Retry-After` header.

#### 500 Internal Server Error

Server-side error occurred.

**Example:**
```json
{
  "error": {
    "code": "INTERNAL",
    "message": "Failed to fetch opportunities"
  }
}
```

**Solution:** Retry the request. If the problem persists, contact support.

---

## Rate Limiting

### Limits

| User Type | Requests per Hour | Burst Limit |
|-----------|------------------|-------------|
| **Anonymous** | 60 | 10 per 10 seconds |
| **Authenticated** | 120 | 10 per 10 seconds |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1706788800000
```

### Handling Rate Limits

**Best Practices:**

1. **Monitor Headers** - Check `X-RateLimit-Remaining` before making requests
2. **Implement Backoff** - Use exponential backoff when approaching limits
3. **Cache Responses** - Cache responses for 5 minutes (matches server cache)
4. **Batch Requests** - Use higher `limit` values to reduce request count

**Example: Rate Limit Handling**

```typescript
async function fetchWithRateLimit(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
  
  if (remaining < 10) {
    console.warn('Approaching rate limit. Consider caching or reducing requests.');
  }
  
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    console.log(`Rate limited. Retry after ${retryAfter} seconds.`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return fetchWithRateLimit(url, token); // Retry
  }
  
  return response.json();
}
```

---

## Best Practices

### 1. Caching

The API responses are cached for 5 minutes. Implement client-side caching to match:

```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, { data: any; timestamp: number }>();

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

### 2. Pagination

Always use cursor-based pagination for large datasets:

```typescript
async function fetchAllOpportunities(token: string) {
  const allItems = [];
  let cursor = null;
  
  do {
    const url = cursor 
      ? `/api/harvest/opportunities?cursor=${cursor}&limit=100`
      : `/api/harvest/opportunities?limit=100`;
      
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    allItems.push(...data.items);
    cursor = data.cursor;
  } while (cursor);
  
  return allItems;
}
```

### 3. Error Handling

Implement comprehensive error handling:

```typescript
async function fetchOpportunities(params: any) {
  try {
    const response = await fetch(buildUrl(params), {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          throw new Error(`Invalid request: ${error.error.message}`);
        case 401:
          // Refresh token and retry
          await refreshToken();
          return fetchOpportunities(params);
        case 429:
          // Wait and retry
          await sleep(error.error.retry_after_sec * 1000);
          return fetchOpportunities(params);
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(error.error.message);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch opportunities:', error);
    throw error;
  }
}
```

### 4. Filtering Efficiently

Use filters to reduce response size and improve performance:

```typescript
// Good: Specific filters
const params = {
  minBenefit: 100,
  riskLevel: ['LOW', 'MEDIUM'],
  limit: 50
};

// Avoid: Fetching everything then filtering client-side
// This wastes bandwidth and rate limit quota
```

### 5. Monitor Performance

Track the `X-Processing-Time` header to monitor API performance:

```typescript
const processingTime = response.headers.get('X-Processing-Time');
if (parseInt(processingTime) > 1000) {
  console.warn('Slow API response:', processingTime, 'ms');
}
```

---

## Code Examples

### JavaScript/TypeScript (React Query)

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

export function useHarvestOpportunities(
  params: UseOpportunitiesParams = {},
  token: string
) {
  return useQuery<OpportunitiesResponse>({
    queryKey: ['harvest-opportunities', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.wallets) {
        params.wallets.forEach(wallet => 
          searchParams.append('wallet', wallet)
        );
      }
      if (params.minBenefit !== undefined) {
        searchParams.append('minBenefit', params.minBenefit.toString());
      }
      if (params.riskLevels) {
        params.riskLevels.forEach(level => 
          searchParams.append('riskLevel', level)
        );
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
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
      }
      
      return response.json();
    },
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error.message.includes('Invalid') || 
          error.message.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Usage in component
function HarvestDashboard() {
  const { data, isLoading, error, refetch } = useHarvestOpportunities(
    {
      minBenefit: 100,
      riskLevels: ['LOW', 'MEDIUM'],
      limit: 20,
    },
    getAuthToken()
  );
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return (
    <div>
      <SummaryCard summary={data.summary} />
      <OpportunityList opportunities={data.items} />
      {data.cursor && (
        <LoadMoreButton cursor={data.cursor} />
      )}
    </div>
  );
}
```

### Python

```python
import requests
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

@dataclass
class OpportunitiesParams:
    wallets: Optional[List[str]] = None
    min_benefit: Optional[float] = None
    risk_levels: Optional[List[str]] = None
    cursor: Optional[str] = None
    limit: int = 20

class HarvestProClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
    
    def get_opportunities(
        self, 
        params: OpportunitiesParams
    ) -> Dict[str, Any]:
        """Fetch harvest opportunities with optional filters."""
        
        query_params = {}
        
        if params.wallets:
            query_params['wallet'] = params.wallets
        if params.min_benefit is not None:
            query_params['minBenefit'] = params.min_benefit
        if params.risk_levels:
            query_params['riskLevel'] = params.risk_levels
        if params.cursor:
            query_params['cursor'] = params.cursor
        if params.limit:
            query_params['limit'] = params.limit
        
        response = self.session.get(
            f'{self.base_url}/api/harvest/opportunities',
            params=query_params
        )
        
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            raise RateLimitError(
                f'Rate limited. Retry after {retry_after} seconds.',
                retry_after=retry_after
            )
        
        response.raise_for_status()
        return response.json()
    
    def get_all_opportunities(
        self,
        params: OpportunitiesParams
    ) -> List[Dict[str, Any]]:
        """Fetch all opportunities using pagination."""
        
        all_items = []
        cursor = None
        
        while True:
            params.cursor = cursor
            data = self.get_opportunities(params)
            
            all_items.extend(data['items'])
            cursor = data.get('cursor')
            
            if not cursor:
                break
        
        return all_items

# Usage
client = HarvestProClient(
    base_url='https://your-domain.com',
    token='your-jwt-token'
)

# Fetch opportunities with filters
opportunities = client.get_opportunities(
    OpportunitiesParams(
        min_benefit=100,
        risk_levels=['LOW', 'MEDIUM'],
        limit=50
    )
)

print(f"Found {len(opportunities['items'])} opportunities")
print(f"Total net benefit: ${opportunities['summary']['estimatedNetBenefit']}")
```

### cURL with jq (Bash)

```bash
#!/bin/bash

# Configuration
API_URL="https://your-domain.com/api/harvest/opportunities"
TOKEN="your-jwt-token"

# Fetch opportunities and parse with jq
fetch_opportunities() {
  local min_benefit=$1
  local risk_level=$2
  
  curl -s -X GET "${API_URL}?minBenefit=${min_benefit}&riskLevel=${risk_level}" \
    -H "Authorization: Bearer ${TOKEN}" \
    | jq '.'
}

# Get summary statistics
get_summary() {
  curl -s -X GET "${API_URL}" \
    -H "Authorization: Bearer ${TOKEN}" \
    | jq '.summary'
}

# Get high-value opportunities (>$500 net benefit)
get_high_value() {
  curl -s -X GET "${API_URL}?minBenefit=500&riskLevel=LOW" \
    -H "Authorization: Bearer ${TOKEN}" \
    | jq '.items[] | {token, netTaxBenefit, riskLevel}'
}

# Check rate limit status
check_rate_limit() {
  curl -s -I -X GET "${API_URL}" \
    -H "Authorization: Bearer ${TOKEN}" \
    | grep -i "x-ratelimit"
}

# Usage
echo "=== Summary ==="
get_summary

echo -e "\n=== High Value Opportunities ==="
get_high_value

echo -e "\n=== Rate Limit Status ==="
check_rate_limit
```

---

## Troubleshooting

### Common Issues

#### Issue: "Authentication required" (401)

**Symptoms:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Solutions:**
1. Verify token is included in Authorization header
2. Check token hasn't expired (tokens expire after 1 hour)
3. Ensure token format is correct: `Bearer <token>`
4. Verify you're using the correct environment's token

#### Issue: "Invalid cursor format" (400)

**Symptoms:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid cursor format"
  }
}
```

**Solutions:**
1. Don't modify the cursor value from the API response
2. Ensure cursor is properly URL-encoded
3. Check cursor hasn't expired (cursors are valid for 1 hour)
4. Start fresh without cursor if issue persists

#### Issue: Rate limit exceeded (429)

**Symptoms:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retry_after_sec": 60
  }
}
```

**Solutions:**
1. Wait for the time specified in `retry_after_sec`
2. Implement exponential backoff
3. Reduce request frequency
4. Increase `limit` parameter to fetch more data per request
5. Implement client-side caching

#### Issue: Empty results

**Symptoms:**
```json
{
  "items": [],
  "cursor": null,
  "summary": {
    "totalHarvestableLoss": 0,
    "estimatedNetBenefit": 0,
    "eligibleTokensCount": 0,
    "gasEfficiencyScore": "C"
  }
}
```

**Possible Causes:**
1. No wallets connected to account
2. No eligible opportunities (all positions are gains)
3. Filters too restrictive
4. All opportunities already harvested

**Solutions:**
1. Connect wallets via the wallet connection API
2. Reduce filter restrictions (lower `minBenefit`, include more risk levels)
3. Check if opportunities exist without filters

#### Issue: Slow response times

**Symptoms:**
- `X-Processing-Time` header shows > 1000ms
- Requests timing out

**Solutions:**
1. Reduce `limit` parameter (try 20-50 instead of 100)
2. Add more specific filters to reduce dataset size
3. Check network connectivity
4. Verify database isn't under heavy load (contact support)

### Debug Checklist

When troubleshooting, check:

- [ ] Authorization header is present and correctly formatted
- [ ] Token is valid and not expired
- [ ] Query parameters are within valid ranges
- [ ] Request URL is correctly formed
- [ ] Network connectivity is stable
- [ ] Rate limits haven't been exceeded
- [ ] API endpoint URL is correct for your environment

---

## Support

### Getting Help

If you encounter issues not covered in this documentation:

1. **Check Status Page** - Verify API is operational
2. **Review Error Message** - Error messages include specific guidance
3. **Check Rate Limits** - Ensure you haven't exceeded limits
4. **Contact Support** - Reach out with request details

### Support Channels

- **Email:** api-support@your-domain.com
- **Documentation:** https://docs.your-domain.com
- **Status Page:** https://status.your-domain.com
- **GitHub Issues:** https://github.com/your-org/harvestpro/issues

### When Contacting Support

Please include:

1. **Request Details**
   - Full request URL (remove sensitive tokens)
   - Request headers (remove Authorization token)
   - Query parameters used

2. **Response Details**
   - HTTP status code
   - Response body
   - Response headers (especially rate limit headers)

3. **Context**
   - Timestamp of request
   - Environment (production/staging/development)
   - Expected vs actual behavior
   - Steps to reproduce

### SLA

- **Response Time:** Within 24 hours for support requests
- **Uptime Target:** 99.9% availability
- **Maintenance Windows:** Announced 48 hours in advance

---

## Changelog

### Version 1.0 (February 2025)

**Initial Release**
- GET /api/harvest/opportunities endpoint
- Cursor-based pagination
- Filtering by wallet, risk level, and minimum benefit
- Rate limiting (60/120 requests per hour)
- Response caching (5 minutes)
- Comprehensive error handling

---

## Legal

### Terms of Use

By using this API, you agree to:
- Use the API only for legitimate tax-loss harvesting purposes
- Not abuse rate limits or attempt to circumvent them
- Keep your authentication tokens secure
- Comply with all applicable laws and regulations

### Data Privacy

- All data is encrypted in transit (HTTPS)
- Authentication tokens expire after 1 hour
- User data is never shared with third parties
- See our Privacy Policy for details

### License

This API documentation is © 2025 Your Company. All rights reserved.

---

**Document Version:** 1.0  
**Last Updated:** February 2025  
**Maintained By:** API Team

For the latest version of this documentation, visit: https://docs.your-domain.com/api/harvest-opportunities
