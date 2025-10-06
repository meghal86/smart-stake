# External Vendor & Upstream Integration List

## Active Integrations

| vendor | hostname(s) | credential env vars | location in repo | server/client-side | usage pattern | rate limits |
|--------|-------------|---------------------|------------------|-------------------|---------------|-------------|
| **Whale Alert** | api.whale-alert.io | WHALE_ALERT_API_KEY | supabase/functions/whale-alerts/index.ts:16 | server-side | Real-time whale transaction data (>$500k) | Unknown, API key required |
| **CoinGecko** | api.coingecko.com | None (public API) | supabase/functions/prices/index.ts:145, src/services/PriceOracle_CoinGecko.ts:14 | server-side | Primary price oracle, free tier | 10 calls/min (self-imposed) |
| **CoinMarketCap** | pro-api.coinmarketcap.com | CMC_API_KEY | supabase/functions/prices/index.ts:161 | server-side | Fallback price oracle | 333 calls/day (tracked) |
| **Etherscan** | api.etherscan.io | ETHERSCAN_API_KEY | src/services/EthBalanceProvider_Etherscan.ts:46, supabase/functions/portfolio-tracker/ | server-side | Ethereum balance lookups | Circuit breaker after 5 failures |
| **Supabase** | *.supabase.co | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | src/integrations/supabase/client.ts, src/lib/supabase.ts | both | Database, auth, edge functions | Varies by plan |
| **Stripe** | api.stripe.com | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | api/create-checkout-session.js, api/webhook.js | server-side | Payment processing, subscriptions | Standard Stripe limits |

## Client-Side References (Display Only)

| vendor | hostname(s) | usage | location in repo |
|--------|-------------|-------|------------------|
| **Etherscan** | etherscan.io | Block explorer links | src/components/whale/WhaleTransactionCard.tsx:115, src/components/WhaleCard.tsx:25 |
| **Various Explorers** | etherscan.io, bscscan.com, polygonscan.com | Multi-chain explorer links | src/components/market-hub/ClusterTransactionsList.tsx:199 |

## Integration Details

### 1. Whale Alert API
- **Purpose**: Live whale transaction monitoring
- **Endpoint**: `https://api.whale-alert.io/v1/transactions`
- **Parameters**: 
  - `api_key`: Required authentication
  - `min_value`: 500000 (minimum $500k transactions)
  - `limit`: 50 transactions per call
  - `start_date`: Unix timestamp (last 24h)
- **Response Format**: JSON with transaction array
- **Error Handling**: Returns 500 on failure, no fallback
- **Caching**: None (real-time data)
- **Sample Call**:
```bash
curl "https://api.whale-alert.io/v1/transactions?api_key=YOUR_KEY&min_value=500000&limit=50"
```

### 2. CoinGecko API
- **Purpose**: Primary cryptocurrency price data
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Parameters**:
  - `ids`: ethereum,bitcoin (comma-separated)
  - `vs_currencies`: usd
  - `include_24hr_change`: true
  - `include_24hr_vol`: true
- **Response Format**: JSON with price objects
- **Error Handling**: Circuit breaker + fallback to CMC
- **Caching**: 15s memory + 15s database
- **Rate Limiting**: Token bucket (10/min)
- **Sample Call**:
```bash
curl "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd"
```

### 3. CoinMarketCap API
- **Purpose**: Fallback price oracle when CoinGecko fails
- **Endpoint**: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`
- **Parameters**:
  - `symbol`: ETH,BTC (comma-separated)
  - `convert`: USD
- **Headers**: `X-CMC_PRO_API_KEY`
- **Response Format**: JSON with quote data
- **Error Handling**: Circuit breaker + stale cache fallback
- **Caching**: 15s memory + 15s database
- **Rate Limiting**: 333 calls/day (tracked in `provider_usage` table)
- **Daily Quota Tracking**: Yes, stored in Supabase
- **Sample Call**:
```bash
curl -H "X-CMC_PRO_API_KEY: YOUR_KEY" \
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ETH,BTC&convert=USD"
```

### 4. Etherscan API
- **Purpose**: Ethereum address balance lookups
- **Endpoint**: `https://api.etherscan.io/api`
- **Parameters**:
  - `module`: account
  - `action`: balance
  - `address`: Ethereum address
  - `tag`: latest
  - `apikey`: API key
- **Response Format**: JSON with balance in wei
- **Error Handling**: Circuit breaker + deterministic fallback
- **Caching**: 30s in-memory cache
- **Circuit Breaker**: Opens after 5 failures, resets after 2 minutes
- **Fallback**: Deterministic balance based on address hash (0.5-2.5 ETH)
- **Sample Call**:
```bash
curl "https://api.etherscan.io/api?module=account&action=balance&address=0x123...&tag=latest&apikey=YOUR_KEY"
```

### 5. Supabase
- **Purpose**: Database, authentication, edge functions
- **Endpoints**:
  - Database: `https://[project-ref].supabase.co/rest/v1/`
  - Auth: `https://[project-ref].supabase.co/auth/v1/`
  - Edge Functions: `https://[project-ref].supabase.co/functions/v1/`
- **Authentication**: 
  - Client: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Server: `SUPABASE_SERVICE_ROLE_KEY`
- **Usage**: All database operations, user auth, serverless functions
- **Rate Limiting**: Based on Supabase plan
- **Caching**: Application-level caching in Edge Functions

### 6. Stripe
- **Purpose**: Payment processing and subscription management
- **Endpoints**:
  - Checkout: `https://api.stripe.com/v1/checkout/sessions`
  - Webhooks: Configured in Stripe dashboard
- **Authentication**: `STRIPE_SECRET_KEY`
- **Webhook Verification**: `STRIPE_WEBHOOK_SECRET`
- **Usage**: Subscription creation, payment verification, webhook handling
- **Rate Limiting**: Standard Stripe API limits

## Environment Variables Required

### Production Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
WHALE_ALERT_API_KEY=...
CMC_API_KEY=...
ETHERSCAN_API_KEY=...
```

### Optional/Development
```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Feature Flags (if needed)
ENABLE_PREMIUM_FEATURES=true
```

## Fallback Strategy

### Price Data Cascade
1. **Memory Cache** (15s TTL) → Instant response
2. **Database Cache** (15s TTL) → <50ms response
3. **CoinGecko API** → ~200-500ms response
4. **CoinMarketCap API** → ~300-700ms response (if CoinGecko fails)
5. **Stale Cache** (2min TTL) → Last known good data
6. **Hardcoded Fallback** → Static prices (ETH: $3500, BTC: $65000)

### Balance Data Cascade
1. **Memory Cache** (30s TTL) → Instant response
2. **Etherscan API** → ~500-1000ms response
3. **Deterministic Fallback** → Hash-based balance (0.5-2.5 ETH)

### Whale Data
- **No fallback**: Real-time data only from Whale Alert API
- **Error handling**: Returns empty array on failure

## Health Monitoring

### Circuit Breaker Status
Check via Edge Function:
```bash
curl "https://[project-ref].supabase.co/functions/v1/prices/health"
```

Response:
```json
{
  "coingecko": {
    "breaker": "closed",
    "minuteRemaining": 8
  },
  "cmc": {
    "breaker": "closed",
    "minuteRemaining": 10,
    "dayUsed": 45,
    "dayRemaining": 288
  },
  "cache": {
    "memoryKeys": 12
  }
}
```

## Usage Tracking

### Database Tables
- `price_cache`: Stores recent price data with TTL
- `provider_usage`: Tracks API call counts per provider/day/minute
- `circuit_breaker_events`: Logs circuit breaker state changes (if implemented)

### Monitoring Queries
```sql
-- Check today's CMC usage
SELECT provider, day_window, SUM(calls) as total_calls
FROM provider_usage
WHERE provider = 'cmc' AND day_window = CURRENT_DATE
GROUP BY provider, day_window;

-- Check recent price cache hits
SELECT asset, provider, COUNT(*) as hits
FROM price_cache
WHERE fetched_at > NOW() - INTERVAL '1 hour'
GROUP BY asset, provider;
```

## Security Notes

1. **API Keys**: All stored in environment variables, never in code
2. **Client vs Server**: Price/balance APIs only called server-side
3. **Rate Limiting**: Implemented at application level to prevent quota exhaustion
4. **Circuit Breakers**: Prevent cascading failures and API ban risks
5. **Webhook Verification**: Stripe webhooks verified with signature

## Cost Estimates (Monthly)

| Vendor | Plan | Estimated Usage | Cost |
|--------|------|-----------------|------|
| Whale Alert | Unknown | ~50 calls/hour | Unknown (contact vendor) |
| CoinGecko | Free | ~14,400 calls/day | $0 |
| CoinMarketCap | Basic | ~333 calls/day | $0 (free tier) |
| Etherscan | Free | ~1,000 calls/day | $0 |
| Supabase | Pro | Database + Edge Functions | ~$25/month |
| Stripe | Standard | Transaction fees | 2.9% + $0.30 per transaction |

**Total Fixed Costs**: ~$25/month + transaction fees
