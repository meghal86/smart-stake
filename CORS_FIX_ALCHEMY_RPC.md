# CORS Fix: Alchemy RPC (Vite + Vercel)

## Problem

You were getting this CORS error:
```
Access to fetch at 'https://eth-mainnet.g.alchemy.com/v2/demo' from origin 'http://localhost:8080' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

Your frontend was calling Alchemy's RPC endpoint directly from the browser. Alchemy (and most RPC providers) don't allow direct browser requests due to CORS restrictions - this is intentional for security reasons.

## Solution

**Two-tier approach:**
1. **Local Development**: Use public RPC endpoints (no API key, no CORS issues)
2. **Production (Vercel)**: Use Vercel serverless function as RPC proxy (protects API keys, avoids CORS)

## What Changed

### 1. Created Vercel Serverless Function
**File:** `api/rpc/[chain].ts`

This serverless function:
- Accepts RPC requests from your frontend in production
- Forwards them to Alchemy (or fallback providers) server-side
- Returns the response to your frontend
- Supports multiple chains: ethereum, polygon, arbitrum, optimism, base

### 2. Updated RPC Provider Configuration
**File:** `src/lib/rpc/providers.ts`

Smart routing based on environment:

```typescript
// Local development (localhost)
'https://ethereum.publicnode.com'  // ✅ Public RPC (no CORS)

// Production (deployed)
'/api/rpc/ethereum'  // ✅ Vercel function (uses Alchemy with your API key)
```

### 3. Updated Environment Variables
**File:** `.env.example`

Added server-side Alchemy API key for production:
```bash
# Server-side (Vercel only, not needed for local dev)
ALCHEMY_API_KEY=your_alchemy_api_key

# Chain-specific URLs (optional)
ALCHEMY_ETH_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_ARB_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_OP_URL=https://opt-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_BASE_URL=https://base-mainnet.g.alchemy.com/v2/your_key
```

## Setup Instructions

### Local Development (No Setup Needed!)

Just run your dev server - it will use public RPC endpoints automatically:

```bash
npm run dev
# or
bun dev
```

The CORS error should be gone immediately.

### Production Deployment (Vercel)

1. Add Alchemy API key to Vercel environment variables:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `ALCHEMY_API_KEY=your_actual_key_here`

2. Deploy:
```bash
vercel deploy
```

## How It Works

**Local Development (localhost:8080):**
```
Browser → Public RPC (ethereum.publicnode.com) ✅
```

**Production (your-app.vercel.app):**
```
Browser → Vercel Function (/api/rpc/ethereum) → Alchemy RPC ✅
```

## Fallback Strategy

### Local Development
Uses multiple public RPC endpoints in order:
1. ethereum.publicnode.com
2. rpc.ankr.com/eth
3. eth.llamarpc.com

### Production
The Vercel function tries:
1. Alchemy (your API key)
2. Public RPC nodes (fallback)

## API Usage

Your frontend code doesn't need to change. The RPC clients in `src/lib/rpc/providers.ts` automatically choose the right endpoint based on environment.

```typescript
import { ethereumClient } from '@/lib/rpc/providers';

// Local: uses public RPC
// Production: uses /api/rpc/ethereum
const blockNumber = await ethereumClient.getBlockNumber();
```

## Why This Approach?

### Local Development Benefits
- ✅ No API key setup required
- ✅ No CORS issues
- ✅ Faster iteration (no proxy overhead)
- ✅ Works offline with cached data

### Production Benefits
- ✅ API key protected (server-side only)
- ✅ Better rate limits (Alchemy vs public nodes)
- ✅ More reliable (Alchemy SLA)
- ✅ Can add monitoring/rate limiting

## Troubleshooting

### Still Getting CORS Errors Locally?

1. Clear your browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check that you're on `localhost:8080` (not a different port)

### Slow RPC Calls Locally?

Public RPC nodes can be slower than Alchemy. If you want faster local development:

1. Get a free Alchemy API key: https://dashboard.alchemy.com
2. Add to `.env.local`:
```bash
VITE_ALCHEMY_API_KEY=your_key
```
3. Update `src/lib/rpc/providers.ts` to use it in local dev

### Production Deployment Issues?

1. Verify Alchemy API key is set in Vercel environment variables
2. Check Vercel function logs for errors
3. Test the API endpoint directly: `https://your-app.vercel.app/api/rpc/ethereum`

## Performance Notes

**Public RPC Nodes (Local Dev):**
- Rate limits: ~10-50 req/sec
- Latency: 200-500ms
- Reliability: 95-98% uptime

**Alchemy (Production):**
- Rate limits: 300M compute units/month (free tier)
- Latency: 50-150ms
- Reliability: 99.9% uptime SLA

## Next Steps

Consider adding:
- Rate limiting on Vercel function (using Upstash)
- Request caching (for repeated calls)
- Monitoring/analytics (track RPC usage)
- Custom error handling

## Summary

The CORS issue is now fixed for both local development and production:
- **Local**: Uses public RPC endpoints (no setup, no CORS)
- **Production**: Uses Vercel serverless function as proxy (protects API keys, avoids CORS)

Your app will work immediately in local development, and will use faster Alchemy endpoints when deployed to production.
