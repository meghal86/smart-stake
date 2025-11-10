# Wallet Signals KV Cache

Read-through cache implementation for wallet signals to reduce redundant blockchain queries across multiple opportunity cards.

## Overview

The wallet signals cache stores blockchain data about wallets (age, transaction count, chain presence) in Redis with a 20-minute TTL. This significantly improves performance when displaying eligibility previews for multiple opportunities to the same wallet.

## Cache Strategy

- **Cache Key Format**: `wallet:signals:{wallet}:{day}`
- **TTL**: 20 minutes (1200 seconds)
- **Day-based Keys**: Cache keys include the current day (YYYY-MM-DD) to ensure daily refresh
- **Normalization**: Wallet addresses are normalized to lowercase for consistent caching

## Usage

### Basic Usage

```typescript
import { getCachedWalletSignals } from '@/lib/wallet-signals-cache';

// Fetch wallet signals with caching
const signals = await getCachedWalletSignals(
  '0x1234567890abcdef1234567890abcdef12345678',
  'ethereum'
);

if (signals) {
  console.log('Wallet age:', signals.walletAgeDays);
  console.log('Transaction count:', signals.txCount);
  console.log('Active chains:', signals.activeChains);
  console.log('Holds on chain:', signals.holdsOnChain);
  console.log('Allowlist proofs:', signals.allowlistProofs);
}
```

### Batch Fetching

```typescript
import { batchGetCachedWalletSignals } from '@/lib/wallet-signals-cache';

// Fetch signals for multiple wallets in parallel
const wallets = [
  '0xwallet1111111111111111111111111111111111',
  '0xwallet2222222222222222222222222222222222',
  '0xwallet3333333333333333333333333333333333',
];

const results = await batchGetCachedWalletSignals(wallets, 'ethereum');

results.forEach((signals, wallet) => {
  console.log(`Signals for ${wallet}:`, signals);
});
```

### Cache Invalidation

```typescript
import { invalidateWalletSignalsCache } from '@/lib/wallet-signals-cache';

// Invalidate cache for a specific wallet
const invalidated = await invalidateWalletSignalsCache(
  '0x1234567890abcdef1234567890abcdef12345678'
);

console.log('Cache invalidated:', invalidated);
```

### Cache Statistics

```typescript
import { getWalletSignalsCacheStats } from '@/lib/wallet-signals-cache';

// Get cache statistics for monitoring
const stats = await getWalletSignalsCacheStats(
  '0x1234567890abcdef1234567890abcdef12345678'
);

console.log('Cache exists:', stats.exists);
console.log('TTL remaining:', stats.ttl, 'seconds');
console.log('Cache key:', stats.key);
```

## Integration with Eligibility Preview

The wallet signals cache is automatically used by the eligibility preview service:

```typescript
import { getEligibilityPreview } from '@/lib/eligibility-preview';

// Eligibility preview automatically uses cached wallet signals
const preview = await getEligibilityPreview(
  '0x1234567890abcdef1234567890abcdef12345678',
  'opportunity-uuid',
  'ethereum'
);

console.log('Status:', preview.status);
console.log('Score:', preview.score);
console.log('Reasons:', preview.reasons);
```

## Performance Benefits

### Without Cache
- Each opportunity card fetches wallet signals independently
- 10 opportunity cards = 10 blockchain API calls
- High latency and API rate limit risk

### With Cache
- First opportunity card fetches and caches wallet signals
- Subsequent cards use cached data
- 10 opportunity cards = 1 blockchain API call + 9 cache hits
- Significantly reduced latency and API usage

## Cache Behavior

### Cache Hit Flow
1. Check Redis for cached signals using `wallet:signals:{wallet}:{day}` key
2. If found and not expired, return cached data immediately
3. No blockchain API call needed

### Cache Miss Flow
1. Check Redis for cached signals
2. If not found, fetch from blockchain API
3. Cache the result with 20-minute TTL
4. Return the fetched data

### Day-based Refresh
- Cache keys include the current day (YYYY-MM-DD)
- Signals are automatically refreshed daily
- Ensures data doesn't become stale over long periods

## Error Handling

The cache implementation is resilient to failures:

- **Redis Unavailable**: Falls back to direct blockchain fetch
- **Cache Read Error**: Logs error and fetches from blockchain
- **Cache Write Error**: Logs warning but returns fetched data
- **Blockchain Fetch Error**: Returns null (handled by caller)

## Monitoring

Monitor cache performance using the stats function:

```typescript
const stats = await getWalletSignalsCacheStats(wallet);

// Track cache hit rate
if (stats.exists) {
  console.log('Cache hit');
} else {
  console.log('Cache miss');
}

// Monitor TTL for cache health
if (stats.ttl < 300) {
  console.log('Cache entry expiring soon');
}
```

## Configuration

Cache TTL is configured in `src/lib/redis/keys.ts`:

```typescript
export const RedisTTL = {
  walletSignals: 1200, // 20 minutes
  // ... other TTLs
};
```

## Testing

### Unit Tests
```bash
npm test src/__tests__/lib/wallet-signals-cache.test.ts
```

### Integration Tests
```bash
npm test src/__tests__/lib/wallet-signals-cache.integration.test.ts
```

## Requirements

Implements requirements 6.1-6.8:
- ✅ Wallet age calculation (25% weight)
- ✅ Transaction count (20% weight)
- ✅ Chain presence (40% weight)
- ✅ Holdings check (15% weight)
- ✅ Allowlist proofs (bonus)
- ✅ Caching to reduce redundant queries
- ✅ 20-minute TTL for freshness
- ✅ Day-based cache keys for daily refresh

## Future Enhancements

1. **Cache Warming**: Pre-populate cache for known wallets
2. **Batch Blockchain Queries**: Fetch multiple wallets in single API call
3. **Cache Metrics**: Track hit rate, latency, and usage patterns
4. **Adaptive TTL**: Adjust TTL based on wallet activity
5. **Multi-region Cache**: Distribute cache across regions for lower latency

## Related Files

- `src/lib/wallet-signals-cache.ts` - Main implementation
- `src/lib/eligibility-preview.ts` - Consumer of wallet signals
- `src/lib/redis/cache.ts` - Redis cache utilities
- `src/lib/redis/keys.ts` - Cache key definitions
- `src/__tests__/lib/wallet-signals-cache.test.ts` - Unit tests
- `src/__tests__/lib/wallet-signals-cache.integration.test.ts` - Integration tests
