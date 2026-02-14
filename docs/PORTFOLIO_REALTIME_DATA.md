# Portfolio Real-Time Data Implementation

This document describes the implementation of real-time data fetching for the AlphaWhale Portfolio page.

## Overview

The portfolio page now fetches real-time data from multiple sources:
- **Guardian**: Security scanning and approval risks
- **Hunter**: Opportunity discovery and DeFi positions
- **Harvest**: Tax loss harvesting recommendations
- **Price Oracle**: Real-time cryptocurrency prices
- **Portfolio Valuation**: On-chain holdings and valuations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Portfolio Page (UI)                      │
│                  (PortfolioRouteShell.tsx)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              React Query Hook Integration                    │
│            (usePortfolioIntegration.ts)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Route Layer                             │
│           /api/v1/portfolio/snapshot                         │
│              (with authentication)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Portfolio Snapshot Service                      │
│          (PortfolioSnapshotService.ts)                       │
│                                                              │
│  Aggregates data from:                                       │
│  ├─ Guardian Service → guardian-scan-v2 Edge Function       │
│  ├─ Hunter Service → hunter-opportunities Edge Function     │
│  ├─ Harvest Service → harvest-recompute Edge Function       │
│  ├─ Portfolio Valuation → portfolio-tracker-live            │
│  └─ Price Oracle → CoinGecko/CoinMarketCap APIs             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Authentication ✅

**File**: `src/lib/auth/serverAuth.ts`

Implements server-side authentication for API routes:

```typescript
// Get authenticated user ID from request
const userId = await getAuthenticatedUserId(request);

if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Features**:
- Bearer token authentication
- Cookie-based session authentication
- Fallback strategy (tries both methods)
- Proper error handling

**Usage in API routes**:
```typescript
import { getAuthenticatedUserId } from '@/lib/auth/serverAuth';

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  // ... use userId for data fetching
}
```

### 2. Guardian Integration ✅

**File**: `src/services/guardianService.ts`

Fetches security data from Guardian edge function:

```typescript
const scanResult = await requestGuardianScan({
  walletAddress: '0x...',
  network: 'ethereum'
});
```

**Returns**:
- Trust score (0-100)
- Risk score (0-10)
- Security flags (critical, high, medium, low)
- Token approvals with risk levels
- Recommendations for each risk

**Approval Mapping**:
- Maps Guardian approvals to `ApprovalRisk` type
- Calculates risk levels based on:
  - Unlimited approvals
  - Unverified contracts
  - Approval age
  - Value at risk

### 3. Hunter Integration ✅

**File**: `src/services/hunterService.ts`

Fetches opportunities from Hunter edge function:

```typescript
const hunterResult = await requestHunterScan({
  walletAddresses: ['0x...', '0x...']
});
```

**Returns**:
- Opportunities (airdrops, yield, arbitrage, rewards)
- DeFi positions (staking, lending, liquidity, farming)
- Estimated values and confidence scores
- Protocol information

**Features**:
- Multi-wallet aggregation
- Confidence scoring
- Expiration tracking

### 4. Harvest Integration ✅

**File**: `src/services/harvestService.ts`

Fetches tax optimization from Harvest edge function:

```typescript
const harvestResult = await requestHarvestScan({
  walletAddresses: ['0x...'],
  taxRate: 0.24
});
```

**Returns**:
- Tax loss harvesting opportunities
- Tax gain harvesting opportunities
- Rebalancing recommendations
- Estimated tax savings
- Unrealized P&L calculations

**Features**:
- Configurable tax rate
- Cost basis tracking
- Multi-wallet support

### 5. Price Oracle ✅

**File**: `src/services/priceOracleService.ts`

Fetches real-time prices from multiple sources:

```typescript
const price = await priceOracleService.getTokenPrice('ETH');
const prices = await priceOracleService.getTokenPrices([
  { symbol: 'ETH' },
  { symbol: 'BTC' },
  { symbol: 'USDC', address: '0x...' }
]);
```

**Features**:
- Primary source: CoinGecko API
- Fallback source: CoinMarketCap API
- In-memory caching (1 minute TTL)
- Batch price fetching
- Request timeout protection (5 seconds)
- Automatic symbol-to-ID mapping

**Supported Tokens**:
- 25+ major cryptocurrencies pre-mapped
- Automatic fallback for unknown tokens
- Address-based lookup support

**Configuration**:
```bash
# .env
COINGECKO_API_KEY=your_api_key_here
COINMARKETCAP_API_KEY=your_api_key_here
```

### 6. Database Setup ✅

**Migration**: `supabase/migrations/20240215000000_create_user_portfolio_addresses.sql`

Creates `user_portfolio_addresses` table:

```sql
CREATE TABLE user_portfolio_addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  address TEXT NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'ethereum',
  is_primary BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(user_id, address)
);
```

**Features**:
- Row Level Security (RLS) enabled
- Users can only access their own addresses
- Indexes for fast lookups
- Cascade delete on user deletion

## Data Flow

### Single Wallet Mode

```
User selects wallet → API call with scope=active_wallet
                    → Fetch data for single address
                    → Return aggregated snapshot
```

### All Wallets Mode

```
User selects "All Wallets" → API call with scope=all_wallets
                           → Query user_portfolio_addresses table
                           → Fetch data for all addresses in parallel
                           → Aggregate results
                           → Return unified snapshot
```

## Caching Strategy

### Client-Side (React Query)

```typescript
{
  staleTime: 60_000,        // 1 minute
  refetchInterval: 30_000,  // 30 seconds
  retry: 2
}
```

### Server-Side (Risk-Aware Cache)

```typescript
{
  critical: 10_000,   // 10 seconds
  high: 30_000,       // 30 seconds
  medium: 60_000,     // 1 minute
  low: 300_000        // 5 minutes
}
```

### Price Oracle Cache

```typescript
{
  ttl: 60_000  // 1 minute
}
```

## Error Handling

### Graceful Degradation

All services implement fallback strategies:

1. **Try real API/Edge Function**
2. **On error, try fallback source** (for prices)
3. **On complete failure, return mock data**
4. **Log errors for monitoring**

### Confidence Scoring

```typescript
{
  confidence: 0.85,  // 85% confidence in data
  degraded: false,   // System operating normally
  freshnessSec: 0    // Data is fresh
}
```

When services fail:
- Confidence drops below threshold (0.70)
- `degraded: true` flag set
- UI shows "Limited Preview Mode" banner
- Some actions may be restricted

## Environment Variables

Required for full functionality:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Price Oracles (Required for real-time prices)
COINGECKO_API_KEY=your_coingecko_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

## Testing

### Unit Tests

```bash
npm test -- src/services/__tests__/
```

Tests cover:
- Authentication utilities
- Service integrations
- Price oracle fallbacks
- Approval mapping
- Confidence aggregation

### Integration Tests

```bash
npm test -- tests/integration/service-connections.test.ts
```

Tests cover:
- End-to-end data flow
- Multi-wallet aggregation
- Error handling
- Cache invalidation

### Manual Testing

1. **Demo Mode**: Works without authentication
2. **Single Wallet**: Select one wallet, verify data loads
3. **All Wallets**: Select "All Wallets", verify aggregation
4. **Error States**: Disable edge functions, verify fallbacks
5. **Price Updates**: Watch prices update every 30 seconds

## Monitoring

### Logs

All services log to console with prefixes:

- `✅` Success
- `⚠️` Warning (fallback used)
- `❌` Error
- `🎭` Mock data used
- `💰` Price oracle
- `🛡️` Guardian
- `🎯` Hunter
- `💰` Harvest
- `📊` Portfolio valuation

### Metrics to Monitor

- API response times
- Edge function success rates
- Price oracle hit rates
- Cache hit/miss ratios
- Authentication failures
- Confidence scores

## Deployment Checklist

- [ ] Run database migration
- [ ] Set environment variables
- [ ] Deploy edge functions
- [ ] Test authentication flow
- [ ] Verify price oracle APIs
- [ ] Test multi-wallet aggregation
- [ ] Monitor error rates
- [ ] Check cache performance

## Troubleshooting

### "Unauthorized" errors

**Cause**: Missing or invalid authentication token

**Fix**:
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set
2. Verify user is logged in
3. Check authorization header format

### Prices not updating

**Cause**: Price oracle API keys missing or invalid

**Fix**:
1. Set `COINGECKO_API_KEY` and `COINMARKETCAP_API_KEY`
2. Verify API keys are valid
3. Check API rate limits

### "No addresses found" error

**Cause**: User has no wallets in `user_portfolio_addresses` table

**Fix**:
1. Run database migration
2. Add wallet addresses via UI
3. Verify RLS policies are correct

### Edge function errors

**Cause**: Edge functions not deployed or failing

**Fix**:
1. Deploy edge functions: `supabase functions deploy`
2. Check edge function logs
3. Verify edge function environment variables

### Mock data showing instead of real data

**Cause**: Edge functions failing, falling back to mock data

**Fix**:
1. Check edge function logs for errors
2. Verify edge function is deployed
3. Test edge function directly
4. Check network connectivity

## Future Enhancements

- [ ] WebSocket support for real-time price updates
- [ ] Redis caching for distributed systems
- [ ] GraphQL API for flexible queries
- [ ] Historical data tracking
- [ ] Performance analytics dashboard
- [ ] Automated alerting on service failures
- [ ] Multi-chain support expansion
- [ ] Advanced portfolio analytics

## Support

For issues or questions:
1. Check logs for error messages
2. Review this documentation
3. Test with demo mode first
4. Verify environment variables
5. Contact development team

---

**Last Updated**: February 15, 2024
**Version**: 1.0.0
