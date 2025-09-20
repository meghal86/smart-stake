# 🏷️ WhalePlus Price Provider System

Production-grade dual price provider with CoinGecko primary and CoinMarketCap backup, featuring circuit breakers, rate limiting, and intelligent caching.

## 🎯 **Features**

- **Dual Provider Failover**: CoinGecko → CoinMarketCap automatic fallback
- **Smart Rate Limiting**: 10 req/min per provider with token bucket algorithm
- **Circuit Breaker**: Auto-disable failed providers for 60s after 3 failures
- **Multi-Level Caching**: Memory (15s) → Database (15s) → Stale (2min)
- **Quota Protection**: CMC daily limit enforcement (333/day)
- **React Integration**: Hooks with Page Visibility API support

## 🚀 **Quick Start**

### 1. Environment Setup
```bash
# Required API Keys
supabase secrets set CMC_API_KEY="your_coinmarketcap_api_key"

# Optional: Custom settings
supabase secrets set PRICE_TTL_SECONDS="15"
supabase secrets set STALE_MAX_SECONDS="120"
```

### 2. Deploy
```bash
# Deploy database schema
supabase db push

# Deploy edge function
supabase functions deploy prices
```

### 3. Usage
```typescript
import { usePrices, usePrice } from '@/hooks/usePrices';

// Multiple assets
const { data, isLoading, error, provider, quality } = usePrices(['ETH', 'BTC'], 30000);

// Single asset
const { price, isLoading, provider, quality } = usePrice('ETH');
```

## 📡 **API Endpoints**

### Get Prices
```http
GET /functions/v1/prices?assets=ETH,BTC
```

**Response:**
```json
{
  "timestamp": "2025-01-22T10:30:00.000Z",
  "provider": "coingecko",
  "quality": "ok",
  "assets": {
    "ETH": { "price_usd": 2470.15 },
    "BTC": { "price_usd": 42350.80 }
  }
}
```

**Headers:**
- `X-Provider`: `gecko|cmc|stale`
- `X-Cache`: `hit|miss|stale`
- `X-Quality`: `ok|degraded|stale`

### Health Check
```http
GET /functions/v1/prices/health
```

**Response:**
```json
{
  "coingecko": {
    "breaker": "closed",
    "minuteRemaining": 7
  },
  "cmc": {
    "breaker": "closed", 
    "minuteRemaining": 9,
    "dayUsed": 118,
    "dayRemaining": 215
  },
  "cache": {
    "memoryKeys": 2
  }
}
```

## ⚙️ **Configuration**

### Rate Limits
- **CoinGecko Free**: 10 requests/minute
- **CoinMarketCap Free**: 10 requests/minute + 333 requests/day
- **Token Bucket**: Refills at 1 token per 6 seconds

### Cache Strategy
- **Memory Cache**: 15 second TTL, in-memory storage
- **Database Cache**: 15 second TTL, persistent storage
- **Stale Cache**: Up to 2 minutes old when all providers fail

### Circuit Breaker
- **Failure Threshold**: 3 failures within 60 seconds
- **Recovery Time**: 60 seconds before retry
- **Timeout**: 1.5 seconds per API call

## 🔄 **Failover Logic**

1. **Memory Cache** (15s TTL) → Return immediately
2. **Database Cache** (15s TTL) → Warm memory, return
3. **CoinGecko API** (if breaker closed + tokens available)
4. **CoinMarketCap API** (if CG fails + quota available)
5. **Stale Cache** (up to 2min old) → Return with `quality: 'stale'`
6. **503 Error** if no data available

## 📊 **Quality Indicators**

- **`ok`**: Fresh data from primary provider (CoinGecko)
- **`degraded`**: Fresh data from backup provider (CoinMarketCap)
- **`stale`**: Cached data older than TTL but within 2 minutes

## 🧪 **Testing**

### Unit Tests
```bash
# Test symbol mapping
deno test --allow-all tests/symbol-mapping.test.ts

# Test TTL logic
deno test --allow-all tests/cache-ttl.test.ts

# Test circuit breaker
deno test --allow-all tests/circuit-breaker.test.ts
```

### Integration Tests
```bash
# Test CoinGecko happy path
curl "https://your-project.supabase.co/functions/v1/prices?assets=ETH,BTC"

# Test failover (when CG is down)
curl "https://your-project.supabase.co/functions/v1/prices?assets=ETH,BTC"

# Test health endpoint
curl "https://your-project.supabase.co/functions/v1/prices/health"
```

### Load Testing
```bash
# 100 concurrent requests in 5 seconds
for i in {1..100}; do
  curl -s "https://your-project.supabase.co/functions/v1/prices?assets=ETH" &
done
wait
```

## 🚨 **Known Limitations**

### CoinMarketCap Quotas
- **Daily Limit**: 333 requests/day (enforced at 320 for safety)
- **Rate Limit**: 10 requests/minute
- **Reset**: Daily quota resets at UTC midnight

### Supported Assets
Currently supports: `ETH`, `BTC`

To add new assets:
1. Update `symbolMap` in `prices/index.ts`
2. Ensure both CoinGecko and CMC support the asset
3. Test failover behavior

## 🔧 **Troubleshooting**

### Common Issues

**503 Service Unavailable**
- Check provider health: `GET /prices/health`
- Verify API keys are set correctly
- Check if daily quotas are exceeded

**Stale Data Warning**
- Normal when both providers are temporarily down
- Data is still reliable within 2-minute window
- Consider increasing cache TTL if needed

**Rate Limit Exceeded**
- Token bucket automatically manages rate limits
- Check health endpoint for remaining tokens
- Consider implementing client-side caching

### Monitoring

**Key Metrics to Track:**
- Cache hit ratio (should be >80% after warmup)
- Provider failure rates
- Daily CMC quota usage
- Response latency (<300ms cache hit, <1500ms cache miss)

**Alerts to Set:**
- CMC daily usage >300 requests
- Circuit breaker open for >5 minutes
- Cache miss ratio >50% for >10 minutes

## 📈 **Performance Targets**

- **Cache Hit**: <300ms response time
- **Cache Miss**: <1500ms response time  
- **Availability**: >99.5% uptime
- **Cache Efficiency**: >80% hit ratio after warmup

## 🔐 **Security**

- API keys stored in Supabase secrets
- Row Level Security on all tables
- Rate limiting prevents abuse
- No sensitive data in logs

---

**Status**: ✅ Production Ready
**Last Updated**: January 2025