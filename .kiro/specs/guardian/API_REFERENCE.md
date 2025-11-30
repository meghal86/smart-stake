# Guardian API Reference

## Complete API Documentation

---

## 1. Guardian Scan API

### Endpoint
```
POST {SUPABASE_URL}/functions/v1/guardian-scan-v2
```

### Authentication
```
Authorization: Bearer {SUPABASE_ANON_KEY}
```

### Request Body
```typescript
{
  wallet_address: string;      // Ethereum address (0x...)
  network: string;             // 'ethereum' | 'base' | 'polygon' | 'arbitrum' | 'optimism' | 'solana'
  request_id?: string;         // Optional tracing ID (auto-generated if not provided)
}
```

### Response (Server-Sent Events)

The API streams progress updates via SSE:

**Event 1: Started**
```
data: {"step":"started","message":"Initiating security scan..."}
```

**Event 2-4: Progress**
```
data: {"step":"progress","message":"Analyzing approvals...","progress":25}
data: {"step":"progress","message":"Checking mixer exposure...","progress":50}
data: {"step":"progress","message":"Evaluating reputation...","progress":75}
```

**Event 5: Complete**
```json
data: {
  "step": "complete",
  "data": {
    "trust_score": 87,
    "risk_score": 6.2,
    "risk_level": "Medium",
    "confidence": 0.85,
    "flags": [
      {
        "id": "1",
        "type": "Mixer Interaction",
        "severity": "medium",
        "details": "Address interacted with Tornado Cash proxy within the last 45 days",
        "timestamp": "2025-01-15T10:30:00Z"
      }
    ],
    "wallet_address": "0xA6bF1D4E9c34d12BfC5e8A946f912e7cC42D2D9C",
    "network": "Ethereum Mainnet",
    "last_scan": "2025-01-30T12:00:00Z",
    "guardian_scan_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Response Headers
```
x-request-id: {trace-id}
content-type: text/event-stream
cache-control: no-cache
```

### Rate Limits
- **Anonymous:** 10 requests/minute per IP
- **Authenticated:** 20 requests/minute per user

### Error Responses

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "retry_after_sec": 60
}
```

**400 Bad Request**
```json
{
  "error": "Invalid wallet address"
}
```

**500 Internal Server Error**
```json
{
  "error": "Scan failed",
  "request_id": "abc-123"
}
```

---

## 2. Guardian Revoke API

### Endpoint
```
POST {SUPABASE_URL}/functions/v1/guardian-revoke-v2
```

### Request Body
```typescript
{
  wallet: string;              // User's wallet address
  approvals: Array<{
    token: string;             // Token contract address
    spender: string;           // Spender contract address
  }>;
  network: string;             // Network identifier
  dry_run?: boolean;           // If true, only estimate (no execution)
}
```

### Response
```typescript
{
  transactions: Array<{
    token: string;             // Token address
    spender: string;           // Spender address
    data: string;              // Encoded transaction data
    to: string;                // Contract address to call
    value: string;             // ETH value (usually "0")
  }>;
  gas_estimate?: {
    total_gas: number;         // Total gas units
    per_tx: number;            // Gas per transaction
  };
  score_delta?: number;        // Expected trust score improvement (+X points)
  idempotency_key?: string;    // For duplicate prevention
}
```

### Idempotency

The API uses Upstash Redis to prevent duplicate revocations:

- **Key Format:** `revoke:{wallet}:{token}:{spender}`
- **TTL:** 5 minutes
- **Behavior:** Returns 409 Conflict if key exists

### Example Usage

**Dry Run (Estimate Only):**
```bash
curl -X POST {SUPABASE_URL}/functions/v1/guardian-revoke-v2 \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x...",
    "approvals": [
      {"token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "spender": "0x..."}
    ],
    "network": "ethereum",
    "dry_run": true
  }'
```

**Response:**
```json
{
  "transactions": [...],
  "gas_estimate": {
    "total_gas": 135000,
    "per_tx": 45000
  },
  "score_delta": 9
}
```

---

## 3. Guardian Summary API (Hunter Integration)

### Endpoint
```
GET /api/guardian/summary?ids={uuid1},{uuid2},...
```

### Query Parameters
- `ids` (required): Comma-separated list of opportunity IDs (max 100)

### Response
```typescript
{
  summaries: {
    [opportunityId: string]: {
      score: number;                    // 0-100
      level: 'green' | 'amber' | 'red'; // Traffic light indicator
      last_scanned_ts: string;          // ISO 8601 timestamp
      top_issues: string[];             // Top 3 issues (max)
    }
  };
  count: number;                        // Number of summaries returned
  requested: number;                    // Number requested
  ts: string;                           // Response timestamp
}
```

### Caching
- **Redis Cache:** 1 hour TTL
- **HTTP Cache:** 5 minutes (public, stale-while-revalidate=600)

### Rate Limits
- **Anonymous:** 60 requests/hour
- **Authenticated:** 120 requests/hour

### Example
```bash
curl "http://localhost:3000/api/guardian/summary?ids=550e8400-e29b-41d4-a716-446655440000,6ba7b810-9dad-11d1-80b4-00c04fd430c8"
```

**Response:**
```json
{
  "summaries": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "score": 87,
      "level": "green",
      "last_scanned_ts": "2025-01-30T12:00:00Z",
      "top_issues": ["Mixer exposure", "1 unlimited approval"]
    },
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8": {
      "score": 45,
      "level": "red",
      "last_scanned_ts": "2025-01-30T11:30:00Z",
      "top_issues": ["Honeypot token", "Bad reputation", "5 unlimited approvals"]
    }
  },
  "count": 2,
  "requested": 2,
  "ts": "2025-01-30T12:05:00Z"
}
```

---

## 4. Health Check API

### Endpoint
```
GET {SUPABASE_URL}/functions/v1/guardian-healthz
```

### Response
```json
{
  "status": "healthy",
  "services": {
    "alchemy": "up",
    "etherscan": "up",
    "upstash": "up"
  },
  "timestamp": "2025-01-30T12:00:00Z"
}
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `RATE_LIMITED` | Too many requests | Wait and retry after `retry_after_sec` |
| `BAD_FILTER` | Invalid query parameters | Check request format |
| `INTERNAL` | Server error | Retry with exponential backoff |
| `UNAUTHORIZED` | Missing/invalid auth | Check API key |
| `NOT_FOUND` | Resource not found | Verify IDs |

---

## Rate Limiting Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706616000
Retry-After: 60
```

---

## Request Tracing

All requests include a unique trace ID for debugging:

**Request Header:**
```
x-request-id: abc-123-def-456
```

**Response Header:**
```
x-request-id: abc-123-def-456
```

Use this ID when reporting issues or debugging.
