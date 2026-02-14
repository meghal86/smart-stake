# Portfolio Real-Time Data - Quick Reference

## 🚀 Quick Start

```bash
# Windows
scripts\setup-portfolio-realtime.bat

# Linux/Mac
chmod +x scripts/setup-portfolio-realtime.sh
./scripts/setup-portfolio-realtime.sh
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth/serverAuth.ts` | Authentication utilities |
| `src/services/priceOracleService.ts` | Real-time price fetching |
| `src/services/guardianService.ts` | Security scanning |
| `src/services/hunterService.ts` | Opportunity discovery |
| `src/services/harvestService.ts` | Tax optimization |
| `src/services/PortfolioSnapshotService.ts` | Data aggregation |
| `src/app/api/v1/portfolio/snapshot/route.ts` | API endpoint |

## 🔑 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (for real-time prices)
COINGECKO_API_KEY=your_coingecko_key
COINMARKETCAP_API_KEY=your_coinmarketcap_key
```

## 🧪 Testing

```bash
# Unit tests
npm test -- src/services/__tests__/

# Integration tests
npm test -- tests/integration/service-connections.test.ts

# Manual test
npm run dev
# Navigate to http://localhost:3000/portfolio
```

## 🔍 Debugging

### Check Logs

```bash
# Look for these prefixes:
✅  # Success (real data)
⚠️  # Warning (fallback used)
❌  # Error
🎭  # Mock data used
💰  # Price oracle
🛡️  # Guardian
🎯  # Hunter
💰  # Harvest
📊  # Portfolio valuation
```

### Common Issues

**"Unauthorized" error**
```bash
# Check authentication
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check user is logged in
- Verify authorization header format
```

**Prices not updating**
```bash
# Check price oracle
- Set COINGECKO_API_KEY and COINMARKETCAP_API_KEY
- Verify API keys are valid
- Check API rate limits
```

**Mock data showing**
```bash
# Check edge functions
- Deploy edge functions: supabase functions deploy <name>
- Check edge function logs
- Verify edge function environment variables
```

## 📊 API Usage

### Get Portfolio Snapshot

```typescript
// Single wallet
GET /api/v1/portfolio/snapshot?scope=active_wallet&wallet=0x...

// All wallets
GET /api/v1/portfolio/snapshot?scope=all_wallets

// Response
{
  data: {
    userId: string,
    netWorth: number,
    delta24h: number,
    freshness: {
      freshnessSec: number,
      confidence: number,
      degraded: boolean
    },
    positions: Position[],
    approvals: ApprovalRisk[],
    recommendedActions: RecommendedAction[],
    riskSummary: {...}
  },
  apiVersion: "v1",
  ts: "2024-02-15T..."
}
```

## 🔧 Service Usage

### Authentication

```typescript
import { getAuthenticatedUserId } from '@/lib/auth/serverAuth';

const userId = await getAuthenticatedUserId(request);
```

### Price Oracle

```typescript
import { priceOracleService } from '@/services/priceOracleService';

// Single price
const price = await priceOracleService.getTokenPrice('ETH');

// Batch prices
const prices = await priceOracleService.getTokenPrices([
  { symbol: 'ETH' },
  { symbol: 'BTC' }
]);
```

### Guardian

```typescript
import { requestGuardianScan } from '@/services/guardianService';

const result = await requestGuardianScan({
  walletAddress: '0x...',
  network: 'ethereum'
});
```

### Hunter

```typescript
import { requestHunterScan } from '@/services/hunterService';

const result = await requestHunterScan({
  walletAddresses: ['0x...', '0x...']
});
```

### Harvest

```typescript
import { requestHarvestScan } from '@/services/harvestService';

const result = await requestHarvestScan({
  walletAddresses: ['0x...'],
  taxRate: 0.24
});
```

## 🗄️ Database

### Add Wallet Address

```sql
INSERT INTO user_portfolio_addresses (user_id, address, label)
VALUES ('user-id', '0x...', 'My Wallet');
```

### Query User Wallets

```sql
SELECT * FROM user_portfolio_addresses 
WHERE user_id = 'user-id';
```

### Update Wallet Label

```sql
UPDATE user_portfolio_addresses 
SET label = 'New Label'
WHERE user_id = 'user-id' AND address = '0x...';
```

## 📈 Performance

### Caching

| Layer | TTL | Strategy |
|-------|-----|----------|
| React Query | 60s | Stale-while-revalidate |
| Server Cache | 10s-5m | Risk-based TTL |
| Price Oracle | 60s | In-memory cache |

### Optimization Tips

- Use batch price fetching for multiple tokens
- Enable React Query devtools for debugging
- Monitor cache hit rates
- Use `scope=active_wallet` for single wallet (faster)

## 🚨 Error Handling

All services implement graceful degradation:

1. Try real API/Edge Function
2. On error, try fallback source (prices only)
3. On complete failure, return mock data
4. Log errors for monitoring

## 📚 Documentation

- **Full Guide**: `docs/PORTFOLIO_REALTIME_DATA.md`
- **Implementation Summary**: `PORTFOLIO_REALTIME_IMPLEMENTATION_SUMMARY.md`
- **This Reference**: `PORTFOLIO_QUICK_REFERENCE.md`

## 🆘 Support

1. Check logs for error messages
2. Review documentation
3. Test with demo mode first
4. Verify environment variables
5. Contact development team

---

**Last Updated**: February 15, 2024
