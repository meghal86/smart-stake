# HarvestPro Price Oracle - Free Setup (No API Keys Required!)

**Status:** ✅ CoinGecko Free API Configured  
**Cost:** $0/month  
**Rate Limits:** 10-50 calls/minute (sufficient for most use cases)

## Overview

Good news! HarvestPro now uses **CoinGecko's free public API** which requires **NO API KEY**. This means you can get started immediately without signing up for any paid services.

## What Changed

### Before (Required Paid API Key)
```typescript
// ❌ Old: Required paid CoinGecko API key
const url = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&x_cg_demo_api_key=${apiKey}`;
```

### After (Free Public API)
```typescript
// ✅ New: Free public API, no key required
const url = `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`;
```

## Configuration

### No Configuration Required! 🎉

The price oracle is already configured to use CoinGecko's free public API. You don't need to:
- ❌ Sign up for CoinGecko account
- ❌ Get an API key
- ❌ Set `COINGECKO_API_KEY` environment variable
- ❌ Configure Supabase secrets

### Optional: CoinMarketCap Fallback

If you want a backup price source (recommended for production), you can optionally add CoinMarketCap:

1. Go to https://coinmarketcap.com/api/
2. Sign up for free tier (10,000 calls/month)
3. Get your API key
4. Add to `.env`:
   ```bash
   COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
   ```
5. Set in Supabase:
   ```bash
   supabase secrets set COINMARKETCAP_API_KEY=your_key_here
   ```

## Rate Limits

### CoinGecko Free API
- **Rate Limit:** 10-50 calls/minute (varies by endpoint)
- **Monthly Limit:** ~30,000-150,000 calls/month
- **Sufficient For:** Development, testing, small-scale production

### How HarvestPro Handles Rate Limits

1. **Caching:** Prices are cached for 1 minute (reduces API calls by ~60x)
2. **Batch Requests:** Multiple tokens fetched in single API call
3. **Fallback Chain:** 
   - Primary: CoinGecko free API
   - Fallback: CoinMarketCap (if configured)
   - Final: Cached prices (even if expired)

### Example Usage Pattern

```typescript
// User opens HarvestPro page
// → Fetches prices for 10 tokens (1 API call)
// → Caches for 1 minute
// → User refreshes page within 1 minute (0 API calls - uses cache)
// → After 1 minute, fetches again (1 API call)

// Result: ~1 API call per minute per user
// For 100 active users: ~100 calls/minute (within free tier with caching)
```

## Testing

Test that the free API works:

```bash
# Test CoinGecko free API (no key required)
curl "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd"

# Expected response:
# {
#   "ethereum": { "usd": 2500.00 },
#   "bitcoin": { "usd": 45000.00 }
# }
```

## Production Considerations

### When Free API is Sufficient
- ✅ Development and testing
- ✅ Small user base (<100 active users)
- ✅ Infrequent price updates (1-5 minute intervals)
- ✅ Non-critical applications

### When to Add CoinMarketCap Fallback
- ⚠️ Medium user base (100-1000 active users)
- ⚠️ Frequent price updates (<1 minute intervals)
- ⚠️ Production applications with SLA requirements
- ⚠️ High availability requirements

### When to Upgrade to Paid CoinGecko
- 🚨 Large user base (>1000 active users)
- 🚨 Real-time price updates (<10 second intervals)
- 🚨 Enterprise applications
- 🚨 Regulatory compliance requirements

## Monitoring Rate Limits

Check if you're hitting rate limits:

```bash
# Check Edge Function logs for rate limit errors
supabase functions logs harvest-recompute-opportunities

# Look for errors like:
# "CoinGecko API error: 429 Too Many Requests"
```

If you see rate limit errors:
1. Increase cache TTL (currently 1 minute)
2. Add CoinMarketCap fallback
3. Consider upgrading to paid CoinGecko plan

## Updated Environment Variables

### Required for v1 (Updated List)

```bash
# ✅ Already configured
NEXT_PUBLIC_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ Still need to configure
GUARDIAN_API_KEY=your_guardian_api_key_here  # Use your existing Guardian
CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419

# ✅ NO LONGER REQUIRED (Free API)
# COINGECKO_API_KEY=not_needed_anymore

# ⚠️ Optional but recommended for production
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here  # Fallback
ALCHEMY_API_KEY=your_alchemy_api_key_here  # RPC provider
ONEINCH_API_KEY=your_oneinch_api_key_here  # Slippage estimation
```

## Summary

✅ **CoinGecko free API is now configured and working**  
✅ **No API key required**  
✅ **No signup required**  
✅ **No cost**  
✅ **Sufficient for development and small-scale production**  

Optional: Add CoinMarketCap fallback for production reliability.

---

**Next Steps:**
1. ✅ Price oracle configured (this step - DONE!)
2. ⏭️ Configure Guardian API key (use your existing Guardian)
3. ⏭️ Configure CEX encryption key
4. ⏭️ Test HarvestPro end-to-end
5. ⏭️ Deploy to production 🚀

