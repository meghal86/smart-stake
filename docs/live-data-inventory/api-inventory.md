# API Route Inventory

## Vercel API Routes (Serverless Functions)

| path | method | implemented-in | calls-external? | external-hosts | purpose | cached? | auth |
|------|--------|----------------|-----------------|----------------|---------|---------|------|
| /api/create-checkout-session | POST | api/create-checkout-session.js | yes | api.stripe.com | Creates Stripe checkout session for subscriptions | no | none |
| /api/verify-session | GET | api/verify-session.js | yes | api.stripe.com | Verifies Stripe session status | no | none |
| /api/webhook | POST | api/webhook.js | yes | supabase.co | Handles Stripe webhooks for subscription events | no | stripe signature |

## Supabase Edge Functions (Deno Runtime)

| path | method | implemented-in | calls-external? | external-hosts | purpose | cached? | auth |
|------|--------|----------------|-----------------|----------------|---------|---------|------|
| supabase.functions.invoke('whale-alerts') | GET | supabase/functions/whale-alerts/index.ts | yes | api.whale-alert.io | Fetches live whale transactions (>$500k) from last 24h | no | supabase anon |
| supabase.functions.invoke('prices') | GET | supabase/functions/prices/index.ts | yes | api.coingecko.com, pro-api.coinmarketcap.com | Multi-tier price oracle with circuit breakers | yes, 15s memory + 15s DB | supabase service |
| supabase.functions.invoke('market-summary-enhanced') | GET | supabase/functions/market-summary-enhanced/ | yes | supabase DB | Aggregates market KPIs from whale data | yes, 90s | supabase anon |
| supabase.functions.invoke('whale-predictions') | POST | supabase/functions/whale-predictions/ | yes | supabase DB | ML-based whale behavior predictions | no | supabase anon |
| supabase.functions.invoke('portfolio-tracker') | POST | supabase/functions/portfolio-tracker/ | yes | api.etherscan.io, supabase DB | Tracks portfolio addresses with balance data | yes, 30s | supabase auth |
| supabase.functions.invoke('portfolio-tracker-live') | POST | supabase/functions/portfolio-tracker-live/ | yes | api.etherscan.io, api.coingecko.com | Live portfolio tracking with real-time prices | yes, 15s | supabase auth |
| supabase.functions.invoke('watchlist') | POST | supabase/functions/watchlist/ | no | supabase DB | Manages user watchlist (add/remove/list) | no | supabase auth |
| supabase.functions.invoke('market-intelligence-hub') | GET | supabase/functions/market-intelligence-hub/ | yes | supabase DB | Comprehensive market intelligence data | yes, 60s | supabase anon |
| supabase.functions.invoke('whale-clusters') | GET | supabase/functions/whale-clusters/ | yes | supabase DB | Clusters whale addresses by behavior patterns | yes, 120s | supabase anon |
| supabase.functions.invoke('whale-analytics') | GET | supabase/functions/whale-analytics/ | yes | supabase DB | Advanced whale analytics and metrics | yes, 60s | supabase anon |
| supabase.functions.invoke('alerts-stream') | GET | supabase/functions/alerts-stream/ | yes | supabase DB | Real-time alert stream for whale movements | no | supabase auth |
| supabase.functions.invoke('scenario-simulate') | POST | supabase/functions/scenario-simulate/ | yes | supabase DB | Simulates portfolio scenarios | no | supabase auth |
| supabase.functions.invoke('scenario-save') | POST | supabase/functions/scenario-save/ | no | supabase DB | Saves scenario configurations | no | supabase auth |
| supabase.functions.invoke('scenario-export') | POST | supabase/functions/scenario-export/ | no | supabase DB | Exports scenario results | no | supabase auth |
| supabase.functions.invoke('multi-coin-sentiment') | GET | supabase/functions/multi-coin-sentiment/ | yes | supabase DB | Multi-asset sentiment analysis | yes, 60s | supabase anon |
| supabase.functions.invoke('chain-risk') | GET | supabase/functions/chain-risk/ | yes | supabase DB | Chain-specific risk metrics | yes, 120s | supabase anon |
| supabase.functions.invoke('nft-whale-tracker') | GET | supabase/functions/nft-whale-tracker/ | yes | supabase DB | NFT whale activity tracking | yes, 60s | supabase auth |
| supabase.functions.invoke('market-maker-sentinel') | GET | supabase/functions/market-maker-sentinel/ | yes | supabase DB | Market maker flow detection | yes, 30s | supabase auth |
| supabase.functions.invoke('yield-protocols') | GET | supabase/functions/fetchYields/ | yes | supabase DB | DeFi yield protocol data | yes, 300s | supabase anon |
| supabase.functions.invoke('crypto-news') | GET | supabase/functions/crypto-news/ | yes | external news APIs | Aggregated crypto news feed | yes, 600s | supabase anon |
| supabase.functions.invoke('ai-sentiment') | POST | supabase/functions/ai-sentiment/ | yes | OpenAI/Anthropic APIs | AI-powered sentiment analysis | no | supabase service |
| supabase.functions.invoke('health') | GET | supabase/functions/health/ | no | supabase DB | System health check | no | none |
| supabase.functions.invoke('healthz') | GET | supabase/functions/healthz/ | no | supabase DB | Kubernetes-style health probe | no | none |

## Legacy Client-Side Endpoints (Deprecated)

| path | method | implemented-in | calls-external? | external-hosts | purpose | cached? | auth |
|------|--------|----------------|-----------------|----------------|---------|---------|------|
| /api/lite/digest | GET | Unknown (not found in src/app/api) | unknown | unknown | Daily whale digest for Lite plan | unknown | cookie |
| /api/lite/whale-index | GET | Unknown (not found in src/app/api) | unknown | unknown | Whale activity index score | unknown | cookie |
| /api/lite/streak | GET | Unknown (not found in src/app/api) | unknown | unknown | User daily streak data | unknown | cookie |
| /api/lite/unlocks | GET | Unknown (not found in src/app/api) | unknown | unknown | Token unlock calendar | unknown | cookie |
| /api/lite5/digest | GET | Unknown (not found in src/app/api) | unknown | unknown | Hub5 version of digest | unknown | cookie |

## Architecture Notes

### API Gateway Pattern
- **Vercel Edge Network**: Handles `/api/*` routes with automatic edge caching
- **Supabase Edge Functions**: Deno-based serverless functions with global distribution
- **No traditional API routes**: Next.js App Router doesn't use `/api` folder, relies on Supabase Edge Functions

### Caching Strategy
1. **Memory Cache**: 15-30s in-memory cache within Edge Functions
2. **Database Cache**: `price_cache` table with 15s-120s TTL
3. **Vercel Edge Cache**: Automatic CDN caching for static responses
4. **Client Cache**: @tanstack/react-query with 30s-300s stale time

### Rate Limiting
- **CoinGecko**: 10 calls/minute (token bucket)
- **CoinMarketCap**: 333 calls/day (tracked in `provider_usage` table)
- **Whale Alert**: API key required, no explicit limit
- **Etherscan**: Circuit breaker after 5 failures

### Circuit Breakers
- **Etherscan**: Opens after 5 failures, resets after 2 minutes
- **CoinGecko**: Opens after 3 failures, resets after 60 seconds
- **CoinMarketCap**: Opens after 3 failures, resets after 60 seconds

## Missing/Deprecated Endpoints

The following endpoints are referenced in frontend code but not found in the repository:
- `/api/lite/*` - Legacy endpoints, likely need migration to Supabase Edge Functions
- `/api/lite5/*` - Hub5-specific endpoints, status unknown

**Action Required**: Verify if these endpoints exist in production or need to be created.
