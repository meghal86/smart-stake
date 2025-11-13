# Multi-Wallet API Documentation

## Overview

This document describes the API endpoints and data structures used by the Multi-Wallet feature in AlphaWhale Hunter Screen.

## Table of Contents

- [Authentication](#authentication)
- [Wallet Context](#wallet-context)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

## Authentication

All multi-wallet API requests require authentication via Supabase Auth.

```typescript
// Headers required for authenticated requests
{
  "Authorization": "Bearer <supabase_access_token>",
  "Content-Type": "application/json"
}
```

## Wallet Context

### Active Wallet Selection

The active wallet is managed client-side and passed as a query parameter or header:

```typescript
// Query parameter (preferred)
GET /api/hunter/opportunities?wallet=0x1234...5678

// Header (alternative)
{
  "X-Active-Wallet": "0x1234...5678"
}
```

### Wallet Hashing

For analytics and server-side storage, wallet addresses are hashed:

```typescript
import { hashWalletAddress } from '@/lib/analytics/hash';

// Hash with per-session salt
const hashedWallet = hashWalletAddress(walletAddress, sessionSalt);
```

## Endpoints

### GET /api/hunter/opportunities

Fetch personalized opportunities for the active wallet.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | No | Active wallet address (0x...) |
| `cursor` | string | No | Pagination cursor |
| `type` | string[] | No | Filter by opportunity types |
| `chains` | string[] | No | Filter by chains |
| `trust_min` | number | No | Minimum trust score (0-100) |
| `eligible` | boolean | No | Show only likely eligible |
| `sort` | string | No | Sort option (recommended, ends_soon, etc.) |

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Opportunity Title",
      "protocol": {
        "name": "Protocol Name",
        "logo": "https://..."
      },
      "type": "airdrop",
      "chains": ["ethereum", "base"],
      "reward": {
        "min": 100,
        "max": 500,
        "currency": "USD",
        "confidence": "estimated"
      },
      "trust": {
        "score": 85,
        "level": "green",
        "last_scanned_ts": "2025-01-15T10:30:00Z"
      },
      "eligibility_preview": {
        "status": "likely",
        "score": 0.85,
        "reasons": [
          "Active on Ethereum",
          "Wallet age > 30 days"
        ]
      }
    }
  ],
  "cursor": "base64_encoded_cursor",
  "ts": "2025-01-15T10:30:00Z"
}
```

**Personalization:**

When `wallet` parameter is provided:
- Opportunities are ranked using personalized algorithm (60% relevance, 25% trust, 15% freshness)
- Eligibility previews are calculated for the specific wallet
- Saved/completed opportunities are factored into ranking

When `wallet` is omitted:
- Default ranking (trending + high trust)
- No eligibility previews
- Generic feed for anonymous users

### GET /api/eligibility/preview

Get eligibility preview for a specific wallet and opportunity.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Wallet address (0x...) |
| `opportunity_id` | string | Yes | Opportunity UUID |

**Response:**

```json
{
  "status": "likely",
  "score": 0.85,
  "reasons": [
    "Active on Ethereum (40% weight)",
    "Wallet age: 45 days (25% weight)",
    "Transaction count: 15 (20% weight)",
    "Holds required tokens (15% weight)"
  ],
  "cached_until": "2025-01-15T11:30:00Z"
}
```

**Status Values:**

- `likely`: Score ≥ 0.7 (green indicator)
- `maybe`: Score 0.4-0.69 (yellow indicator)
- `unlikely`: Score < 0.4 (red indicator)
- `unknown`: Unable to determine (gray indicator)

**Caching:**

- Results cached for 60 minutes per wallet/opportunity pair
- Cache key: `eligibility:{opportunity_id}:{wallet_hash}`
- Cached in `eligibility_cache` table

### GET /api/wallet/signals

Fetch wallet signals for eligibility calculation (internal use).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Wallet address (0x...) |
| `chains` | string[] | No | Chains to check |

**Response:**

```json
{
  "wallet_age_days": 45,
  "tx_count": 15,
  "chains_active": ["ethereum", "base", "arbitrum"],
  "holdings": {
    "ethereum": {
      "eth_balance": "1.5",
      "token_count": 8,
      "nft_count": 3
    }
  },
  "cached_until": "2025-01-15T10:50:00Z"
}
```

**Caching:**

- Results cached for 20 minutes
- Cache key: `wallet_signals:{wallet}:{day}`
- Reduces redundant blockchain queries

### POST /api/hunter/save

Save an opportunity for later (bookmarking).

**Request Body:**

```json
{
  "opportunity_id": "uuid",
  "wallet": "0x1234...5678"
}
```

**Response:**

```json
{
  "success": true,
  "saved_at": "2025-01-15T10:30:00Z"
}
```

**Notes:**

- Saved opportunities are user-specific, not wallet-specific
- All saved items visible regardless of active wallet
- RLS policies enforce user ownership

### DELETE /api/hunter/save/:id

Remove a saved opportunity.

**Response:**

```json
{
  "success": true
}
```

### GET /api/hunter/saved

Get all saved opportunities for the authenticated user.

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "opportunity": { /* full opportunity object */ },
      "saved_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/analytics/track

Track analytics events (wallet switching, eligibility checks, etc.).

**Request Body:**

```json
{
  "event_type": "wallet_switched",
  "wallet_hash": "hashed_wallet_address",
  "metadata": {
    "from_wallet_hash": "previous_wallet_hash",
    "to_wallet_hash": "new_wallet_hash",
    "switch_duration_ms": 450
  }
}
```

**Event Types:**

- `wallet_connected`: New wallet connected
- `wallet_disconnected`: Wallet removed
- `wallet_switched`: Active wallet changed
- `eligibility_checked`: Eligibility preview viewed
- `feed_personalized`: Personalized feed loaded

**Privacy:**

- Wallet addresses are ALWAYS hashed before sending
- Per-session salt used for hashing
- Plain text addresses NEVER sent to analytics

## Data Models

### Wallet Context (Client-Side)

```typescript
interface WalletContextState {
  // Connected wallets
  wallets: ConnectedWallet[];
  
  // Currently active wallet
  activeWallet: string | null;
  
  // Wallet labels (localStorage)
  labels: Record<string, string>;
  
  // ENS names (cached)
  ensNames: Record<string, string | null>;
  
  // Loading states
  isConnecting: boolean;
  isSwitching: boolean;
  
  // Actions
  connectWallet: (provider: WalletProvider) => Promise<void>;
  disconnectWallet: (address: string) => Promise<void>;
  setActiveWallet: (address: string) => void;
  setWalletLabel: (address: string, label: string) => void;
}

interface ConnectedWallet {
  address: string;
  provider: WalletProvider;
  chainId: number;
  ensName?: string;
  label?: string;
}

type WalletProvider = 
  | 'metamask' 
  | 'walletconnect' 
  | 'coinbase' 
  | 'injected';
```

### Eligibility Cache (Database)

```sql
CREATE TABLE eligibility_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('likely', 'maybe', 'unlikely', 'unknown')),
  score NUMERIC CHECK (score >= 0 AND score <= 1),
  reasons JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(opportunity_id, wallet_address)
);

CREATE INDEX idx_eligibility_cache_lookup 
  ON eligibility_cache(opportunity_id, wallet_address, expires_at);
```

### Wallet Labels (localStorage)

```typescript
// Stored in localStorage as JSON
interface WalletLabelsStorage {
  version: number;
  labels: {
    [address: string]: {
      label: string;
      updated_at: string;
    };
  };
}

// Example
{
  "version": 1,
  "labels": {
    "0x1234...5678": {
      "label": "Trading Wallet",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `WALLET_NOT_CONNECTED` | 400 | No wallet address provided |
| `INVALID_WALLET_ADDRESS` | 400 | Malformed wallet address |
| `WALLET_NOT_FOUND` | 404 | Wallet not in connected list |
| `ELIGIBILITY_UNAVAILABLE` | 503 | Cannot fetch blockchain data |
| `RATE_LIMITED` | 429 | Too many requests |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |

### Example Error Responses

**Invalid Wallet Address:**

```json
{
  "error": {
    "code": "INVALID_WALLET_ADDRESS",
    "message": "Wallet address must be a valid Ethereum address (0x...)",
    "details": {
      "provided": "invalid_address"
    }
  }
}
```

**Rate Limited:**

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retry_after_sec": 60
  }
}
```

## Rate Limiting

### Limits by Endpoint

| Endpoint | Anonymous | Authenticated | Burst |
|----------|-----------|---------------|-------|
| `/api/hunter/opportunities` | 60/hour | 120/hour | 10/10s |
| `/api/eligibility/preview` | 30/hour | 100/hour | 5/10s |
| `/api/wallet/signals` | N/A | 50/hour | 5/10s |
| `/api/hunter/save` | N/A | 100/hour | 10/10s |
| `/api/analytics/track` | N/A | 500/hour | 20/10s |

### Rate Limit Headers

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1642252800
Retry-After: 60
```

### Handling Rate Limits

```typescript
async function fetchWithRetry(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return fetchWithRetry(url, options);
  }
  
  return response;
}
```

## Security

### Wallet Address Hashing

```typescript
import crypto from 'crypto';

// Server-side hashing with per-session salt
export function hashWalletAddress(
  address: string, 
  sessionSalt: string
): string {
  const normalized = address.toLowerCase();
  return crypto
    .createHmac('sha256', sessionSalt)
    .update(normalized)
    .digest('hex');
}

// Client-side (for analytics)
export function hashWalletForAnalytics(
  address: string
): string {
  // Use session-specific salt from context
  const sessionSalt = getSessionSalt();
  return hashWalletAddress(address, sessionSalt);
}
```

### Input Validation

```typescript
import { z } from 'zod';

// Wallet address validation
const WalletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// Validate in API routes
const { wallet } = WalletAddressSchema.parse(req.query.wallet);
```

### RLS Policies

```sql
-- Saved opportunities: users can only access their own
CREATE POLICY p_sel_saved ON saved_opportunities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY p_ins_saved ON saved_opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY p_del_saved ON saved_opportunities
  FOR DELETE USING (auth.uid() = user_id);

-- Eligibility cache: read-only for authenticated users
CREATE POLICY p_sel_eligibility ON eligibility_cache
  FOR SELECT USING (auth.role() = 'authenticated');
```

### CORS Configuration

```typescript
// Next.js API route CORS headers
export async function GET(req: NextRequest) {
  const response = NextResponse.json(data);
  
  response.headers.set('Access-Control-Allow-Origin', 'https://alphawhale.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}
```

## Best Practices

### Client-Side Implementation

1. **Cache Wallet Data:** Store connected wallets in context/state
2. **Debounce Switches:** Prevent rapid wallet switching
3. **Show Loading States:** Display spinners during switches
4. **Handle Errors Gracefully:** Show user-friendly error messages
5. **Persist Selection:** Save active wallet to sessionStorage

### Server-Side Implementation

1. **Validate Addresses:** Always validate wallet addresses
2. **Hash Before Storage:** Never store plain text addresses
3. **Use Caching:** Cache eligibility and wallet signals
4. **Rate Limit:** Protect against abuse
5. **Log Errors:** Track failures for debugging

### Performance Optimization

1. **Batch Requests:** Fetch multiple eligibilities at once
2. **Prefetch Data:** Load next wallet's data in background
3. **Use CDN:** Cache static responses at edge
4. **Optimize Queries:** Use proper indexes on database
5. **Compress Responses:** Enable gzip/brotli compression

## Testing

### Example Test Cases

```typescript
describe('Multi-Wallet API', () => {
  it('should return personalized feed for wallet', async () => {
    const response = await fetch(
      '/api/hunter/opportunities?wallet=0x1234...5678'
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(data.items[0].eligibility_preview).toBeDefined();
  });

  it('should cache eligibility results', async () => {
    const wallet = '0x1234...5678';
    const opportunityId = 'uuid';
    
    // First request
    const start1 = Date.now();
    await fetch(`/api/eligibility/preview?wallet=${wallet}&opportunity_id=${opportunityId}`);
    const duration1 = Date.now() - start1;
    
    // Second request (cached)
    const start2 = Date.now();
    await fetch(`/api/eligibility/preview?wallet=${wallet}&opportunity_id=${opportunityId}`);
    const duration2 = Date.now() - start2;
    
    expect(duration2).toBeLessThan(duration1 * 0.5);
  });

  it('should enforce rate limits', async () => {
    const requests = Array(70).fill(null).map(() =>
      fetch('/api/hunter/opportunities')
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

## Changelog

### Version 1.0 (Current)
- Initial multi-wallet API support
- Personalized feed endpoint
- Eligibility preview endpoint
- Wallet signals caching
- Analytics tracking
- Rate limiting
- Security hardening

### Coming Soon
- Bulk eligibility checks
- Wallet comparison endpoint
- Cross-wallet analytics
- Wallet groups API
