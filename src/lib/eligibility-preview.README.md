# Eligibility Preview Service

The eligibility preview service provides wallet eligibility calculations for opportunities with intelligent caching to prevent redundant blockchain queries.

## Overview

This service implements Requirements 6.1-6.8 from the Hunter Screen specification:
- Fetches wallet signals (age, transaction count, chain presence, holdings)
- Calculates eligibility scores using the weighted algorithm
- Caches results for 60 minutes to optimize performance
- Always provides at least one human-readable reason
- Handles errors gracefully with "Unknown" status

## Usage

### Basic Usage

```typescript
import { getEligibilityPreview } from '@/lib/eligibility-preview';

// Get eligibility preview for a wallet and opportunity
const preview = await getEligibilityPreview(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  'opportunity-uuid-123',
  'ethereum'
);

console.log(preview);
// {
//   status: 'likely',
//   score: 0.85,
//   reasons: [
//     'Active on ethereum',
//     'Wallet age 30+ days',
//     '10+ transactions',
//     'Holds tokens on chain'
//   ],
//   cachedUntil: '2025-01-08T12:00:00.000Z'
// }
```

### Status Labels

The service returns one of four status labels:

- **`likely`**: Score ≥ 0.7 - User is likely eligible
- **`maybe`**: Score 0.4-0.69 - User might be eligible
- **`unlikely`**: Score < 0.4 - User is unlikely to be eligible
- **`unknown`**: Unable to determine eligibility (with reason)

### Caching Behavior

Results are automatically cached in the `eligibility_cache` table with a 60-minute TTL:

1. **Cache Hit**: Returns cached result immediately
2. **Cache Miss**: Fetches wallet signals, calculates score, caches result
3. **Cache Expiry**: Automatically expires after 60 minutes

### Cache Management

```typescript
import {
  clearEligibilityCache,
  clearExpiredEligibilityCache,
} from '@/lib/eligibility-preview';

// Clear cache for a specific opportunity (e.g., when requirements change)
const deletedCount = await clearEligibilityCache('opportunity-uuid-123');
console.log(`Cleared ${deletedCount} cache entries`);

// Clear all expired cache entries (run as periodic cleanup job)
const expiredCount = await clearExpiredEligibilityCache();
console.log(`Cleared ${expiredCount} expired entries`);
```

## Scoring Algorithm

The eligibility score is calculated using weighted components:

| Component | Weight | Cap | Description |
|-----------|--------|-----|-------------|
| Chain Presence | 40% | - | Wallet has activity on required chain |
| Wallet Age | 25% | 30 days | Age of wallet in days |
| Transaction Count | 20% | 10 tx | Number of transactions |
| Holdings | 15% | - | Holds tokens on required chain |
| Allowlist Bonus | +5% | - | Wallet is on allowlist |

**Total possible score**: 1.05 (105%) with allowlist bonus

See `src/lib/eligibility.ts` for the detailed scoring implementation.

## Error Handling

The service handles errors gracefully and always returns a valid response:

### Input Validation Errors
```typescript
const result = await getEligibilityPreview('', 'opp-123', 'ethereum');
// {
//   status: 'unknown',
//   score: 0,
//   reasons: ['Invalid input: wallet address, opportunity ID, and chain are required'],
//   cachedUntil: '...'
// }
```

### Blockchain Query Failures
```typescript
// When wallet signals cannot be fetched
// {
//   status: 'unknown',
//   score: 0,
//   reasons: ['Unable to fetch wallet data. Please try again later.'],
//   cachedUntil: '...'
// }
```

### Database Errors
```typescript
// When database operations fail
// {
//   status: 'unknown',
//   score: 0,
//   reasons: ['An error occurred while checking eligibility. Please try again.'],
//   cachedUntil: '...'
// }
```

## Implementation Notes

### Wallet Address Normalization

Wallet addresses are automatically normalized to lowercase for consistent caching:

```typescript
// These are treated as the same wallet
await getEligibilityPreview('0xABC123...', 'opp-1', 'ethereum');
await getEligibilityPreview('0xabc123...', 'opp-1', 'ethereum');
// Both use cache key: '0xabc123...'
```

### Blockchain Data Fetching

The current implementation includes a placeholder for blockchain data fetching:

```typescript
async function fetchWalletSignals(
  walletAddress: string,
  requiredChain: string
): Promise<WalletSignals | null>
```

**TODO**: Replace with actual blockchain API calls to services like:
- Alchemy
- Moralis
- Etherscan
- QuickNode
- The Graph

### Cache TTL

The 60-minute cache TTL balances:
- **Performance**: Reduces redundant blockchain queries
- **Freshness**: Ensures eligibility reflects recent wallet activity
- **Cost**: Minimizes API calls to blockchain data providers

## Database Schema

The service uses the `eligibility_cache` table:

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

## Testing

Comprehensive unit tests are available in `src/__tests__/lib/eligibility-preview.test.ts`:

```bash
npm test -- src/__tests__/lib/eligibility-preview.test.ts
```

Test coverage includes:
- Input validation
- Cache hit/miss scenarios
- Error handling
- Cache management functions
- TTL verification
- Wallet address normalization

## Performance Considerations

### Cache Hit Rate

Monitor cache hit rate to optimize TTL:

```sql
-- Query cache hit rate
SELECT 
  COUNT(*) FILTER (WHERE cached_at > NOW() - INTERVAL '1 hour') as recent_hits,
  COUNT(*) as total_entries,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cached_at > NOW() - INTERVAL '1 hour') / NULLIF(COUNT(*), 0), 2) as hit_rate_pct
FROM eligibility_cache
WHERE expires_at > NOW();
```

### Cleanup Job

Run periodic cleanup to remove expired entries:

```typescript
// Run every hour via cron job
import { clearExpiredEligibilityCache } from '@/lib/eligibility-preview';

export async function cleanupExpiredCache() {
  const count = await clearExpiredEligibilityCache();
  console.log(`Cleaned up ${count} expired eligibility cache entries`);
}
```

### Query Optimization

The unique constraint on `(opportunity_id, wallet_address)` ensures:
- No duplicate cache entries
- Fast lookups via index
- Automatic upsert behavior

## Integration Example

### In Opportunity Card Component

```typescript
import { getEligibilityPreview } from '@/lib/eligibility-preview';
import { useQuery } from '@tanstack/react-query';

function OpportunityCard({ opportunity, walletAddress }) {
  const { data: eligibility, isLoading } = useQuery({
    queryKey: ['eligibility', opportunity.id, walletAddress],
    queryFn: () => getEligibilityPreview(
      walletAddress,
      opportunity.id,
      opportunity.chains[0] // Primary chain
    ),
    enabled: !!walletAddress,
    staleTime: 60 * 60 * 1000, // 60 minutes
  });

  if (!walletAddress) {
    return <div>Connect wallet to check eligibility</div>;
  }

  if (isLoading) {
    return <div>Checking eligibility...</div>;
  }

  return (
    <div>
      <EligibilityBadge status={eligibility.status} />
      <ul>
        {eligibility.reasons.map((reason, i) => (
          <li key={i}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Future Enhancements

1. **Real Blockchain Integration**: Replace mock `fetchWalletSignals` with actual API calls
2. **Multi-Chain Support**: Check eligibility across multiple chains simultaneously
3. **Allowlist Verification**: Integrate with Merkle tree or API-based allowlist checking
4. **Score Breakdown**: Expose detailed score breakdown in UI for transparency
5. **Batch Queries**: Support batch eligibility checks for multiple opportunities
6. **Webhook Updates**: Invalidate cache when wallet activity is detected

## Related Files

- `src/lib/eligibility.ts` - Core scoring algorithm
- `src/__tests__/lib/eligibility.test.ts` - Scoring algorithm tests
- `src/__tests__/lib/eligibility-preview.test.ts` - Service tests
- `supabase/migrations/20250104000000_hunter_screen_schema.sql` - Database schema

## Requirements Mapping

This service implements the following requirements from the Hunter Screen specification:

- **6.1**: Weighted scoring algorithm (40% chain, 25% age, 20% tx, 15% holdings, +5% allowlist)
- **6.2**: "Likely Eligible" label for score ≥ 0.7
- **6.3**: "Maybe Eligible" label for score 0.4-0.69
- **6.4**: "Unlikely Eligible" label for score < 0.4
- **6.5**: 1-2 reason bullets explaining determination
- **6.6**: 60-minute cache TTL per wallet/opportunity
- **6.7**: No direct wallet balance exposure (qualitative labels only)
- **6.8**: Neutral "Unknown" label when eligibility cannot be computed
