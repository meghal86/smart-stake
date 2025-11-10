# Redis Caching Utilities

Comprehensive Redis caching utilities for the Hunter Screen feature, providing consistent key management, cache operations, and invalidation strategies.

## Overview

This module provides:
- **Redis Client**: Singleton Redis client with connection management
- **Key Namespace**: Consistent key naming to prevent collisions
- **Cache Operations**: Get/set helpers with TTL support
- **Invalidation**: Pattern-based and specific cache invalidation
- **Batch Operations**: Efficient multi-key operations

## Requirements

Implements requirements: 8.7, 8.8, 8.9 from the Hunter Screen specification.

## Setup

### Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Installation

Dependencies are already included in package.json:
- `@upstash/redis` - Redis client for Upstash
- `@upstash/ratelimit` - Rate limiting utilities

## Usage

### Basic Cache Operations

```typescript
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

// Set a value with TTL
await cacheSet('my-key', { foo: 'bar' }, { ttl: 300 }); // 5 minutes

// Get a value
const result = await cacheGet<{ foo: string }>('my-key');
if (result.hit) {
  console.log(result.data); // { foo: 'bar' }
}

// Delete a key
await cacheDel('my-key');
```

### Using Key Namespaces

```typescript
import { RedisKeys, RedisTTL, cacheSet, cacheGet } from '@/lib/redis';

// Guardian scan cache
const key = RedisKeys.guardianScan('opportunity-123');
await cacheSet(key, scanData, { ttl: RedisTTL.guardianScan });

// Eligibility cache
const eligKey = RedisKeys.eligibility('opp-456', 'wallet-hash');
await cacheSet(eligKey, eligibilityData, { ttl: RedisTTL.eligibility });

// Wallet signals cache
const today = new Date().toISOString().split('T')[0];
const signalsKey = RedisKeys.walletSignals('0x123...', today);
await cacheSet(signalsKey, signals, { ttl: RedisTTL.walletSignals });
```

### Get-or-Set Pattern

```typescript
import { cacheGetOrSet, RedisKeys, RedisTTL } from '@/lib/redis';

// Fetch from cache or compute
const data = await cacheGetOrSet(
  RedisKeys.trending(),
  async () => {
    // This function only runs if cache miss
    return await fetchTrendingOpportunities();
  },
  RedisTTL.trending
);
```

### Cache Invalidation

```typescript
import {
  invalidateGuardianScans,
  invalidateEligibility,
  invalidateFeedPages,
  invalidateOpportunityDetail,
  cacheInvalidatePattern,
} from '@/lib/redis';

// Invalidate all guardian scans
await invalidateGuardianScans();

// Invalidate eligibility for specific opportunity
await invalidateEligibility('opportunity-123');

// Invalidate all feed pages
await invalidateFeedPages();

// Invalidate specific opportunity detail
await invalidateOpportunityDetail('aave-staking');

// Custom pattern invalidation
await cacheInvalidatePattern('custom:pattern:*');
```

### Batch Operations

```typescript
import { cacheMGet, cacheMSet } from '@/lib/redis';

// Batch get multiple keys
const keys = ['key1', 'key2', 'key3'];
const results = await cacheMGet<string>(keys);
results.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});

// Batch set multiple keys
const entries: Array<[string, any, number?]> = [
  ['key1', 'value1', 300],
  ['key2', 'value2', 600],
  ['key3', 'value3'], // No TTL
];
await cacheMSet(entries);
```

### Counters

```typescript
import { cacheIncr, cacheDecr } from '@/lib/redis';

// Increment counter
const newValue = await cacheIncr('page-views'); // +1
const newValue2 = await cacheIncr('page-views', 10); // +10

// Decrement counter
const newValue3 = await cacheDecr('remaining-quota'); // -1
const newValue4 = await cacheDecr('remaining-quota', 5); // -5
```

### Advanced Options

```typescript
import { cacheSet, cacheExists, cacheTTL, cacheExpire } from '@/lib/redis';

// Set only if not exists (NX)
await cacheSet('key', 'value', { nx: true });

// Set only if exists (XX)
await cacheSet('key', 'value', { xx: true });

// Check if key exists
const exists = await cacheExists('key');

// Get remaining TTL
const ttl = await cacheTTL('key'); // seconds, -1 if no expiry, -2 if not exists

// Update TTL on existing key
await cacheExpire('key', 600); // 10 minutes
```

## Key Namespaces

All keys use consistent namespacing to prevent collisions:

| Function | Pattern | Example | TTL |
|----------|---------|---------|-----|
| `guardianScan(id)` | `guardian:scan:{id}` | `guardian:scan:opp-123` | 1 hour |
| `eligibility(oppId, walletHash)` | `elig:op:{oppId}:wa:{walletHash}` | `elig:op:123:wa:abc` | 1 hour |
| `walletSignals(wallet, day)` | `wallet:signals:{wallet}:{day}` | `wallet:signals:0x123:2025-01-05` | 20 min |
| `trending()` | `feed:trending` | `feed:trending` | 10 min |
| `userPrefs(userId)` | `user:prefs:{userId}` | `user:prefs:user-123` | 30 min |
| `feedPage(hash, cursor)` | `feed:page:{hash}:{cursor}` | `feed:page:abc:first` | 5 min |
| `opportunityDetail(slug)` | `opp:detail:{slug}` | `opp:detail:aave-staking` | 10 min |
| `rateLimit(id, endpoint)` | `ratelimit:{endpoint}:{id}` | `ratelimit:/api/feed:192.168.1.1` | varies |
| `lock(resource)` | `lock:{resource}` | `lock:sync-job` | varies |
| `session(sessId, key)` | `session:{sessId}:{key}` | `session:sess-123:filters` | 24 hours |

## Key Patterns for Bulk Operations

Use these patterns with `cacheInvalidatePattern()`:

```typescript
import { RedisKeyPatterns } from '@/lib/redis';

RedisKeyPatterns.allGuardianScans    // 'guardian:scan:*'
RedisKeyPatterns.allEligibility      // 'elig:op:*'
RedisKeyPatterns.allWalletSignals    // 'wallet:signals:*'
RedisKeyPatterns.allFeedPages        // 'feed:page:*'
RedisKeyPatterns.allOpportunityDetails // 'opp:detail:*'
RedisKeyPatterns.allUserPrefs        // 'user:prefs:*'
RedisKeyPatterns.allRateLimits       // 'ratelimit:*'
RedisKeyPatterns.allLocks            // 'lock:*'
RedisKeyPatterns.allSessions         // 'session:*'
```

## TTL Constants

Predefined TTL values (in seconds):

```typescript
import { RedisTTL } from '@/lib/redis';

RedisTTL.guardianScan      // 3600 (1 hour)
RedisTTL.eligibility       // 3600 (1 hour)
RedisTTL.walletSignals     // 1200 (20 minutes)
RedisTTL.trending          // 600 (10 minutes)
RedisTTL.userPrefs         // 1800 (30 minutes)
RedisTTL.feedPage          // 300 (5 minutes)
RedisTTL.opportunityDetail // 600 (10 minutes)
RedisTTL.session           // 86400 (24 hours)
```

## Error Handling

All cache operations gracefully handle errors:

- **Redis Unavailable**: Operations return default values (null, false, 0) without throwing
- **Network Errors**: Logged to console, operations continue
- **Invalid Data**: Validation should be done at application level

```typescript
// Safe to use even if Redis is down
const result = await cacheGet('key');
if (result.hit) {
  // Use cached data
} else {
  // Fetch from source
}
```

## Best Practices

### 1. Always Use Namespaced Keys

```typescript
// ✅ Good
const key = RedisKeys.guardianScan(opportunityId);

// ❌ Bad
const key = `guardian-${opportunityId}`;
```

### 2. Use Appropriate TTLs

```typescript
// ✅ Good - Use predefined TTLs
await cacheSet(key, data, { ttl: RedisTTL.guardianScan });

// ⚠️ Acceptable - Custom TTL with reason
await cacheSet(key, data, { ttl: 120 }); // 2 min for real-time data
```

### 3. Handle Cache Misses Gracefully

```typescript
// ✅ Good
const cached = await cacheGet<Data>(key);
const data = cached.hit ? cached.data : await fetchFromSource();

// ❌ Bad - Assumes cache always hits
const data = (await cacheGet<Data>(key)).data!;
```

### 4. Invalidate Related Caches

```typescript
// ✅ Good - Invalidate all related caches
async function updateOpportunity(id: string) {
  await updateDatabase(id);
  await invalidateOpportunityDetail(slug);
  await invalidateEligibility(id);
  await invalidateFeedPages();
}
```

### 5. Use Batch Operations for Multiple Keys

```typescript
// ✅ Good - Single round trip
const results = await cacheMGet(['key1', 'key2', 'key3']);

// ❌ Bad - Multiple round trips
const val1 = await cacheGet('key1');
const val2 = await cacheGet('key2');
const val3 = await cacheGet('key3');
```

## Testing

Comprehensive test suite included:

```bash
# Run Redis tests
npm test -- src/__tests__/lib/redis --run

# Run with coverage
npm test -- src/__tests__/lib/redis --coverage
```

Tests cover:
- ✅ Key namespace generation
- ✅ Cache get/set/delete operations
- ✅ TTL management
- ✅ Pattern-based invalidation
- ✅ Batch operations
- ✅ Error handling
- ✅ Redis unavailable scenarios

## Performance Considerations

### Cache Hit Rates

Monitor cache hit rates for optimization:

```typescript
const result = await cacheGet(key);
if (result.hit) {
  // Track hit
  analytics.track('cache_hit', { key });
} else {
  // Track miss
  analytics.track('cache_miss', { key });
}
```

### Batch Operations

Use batch operations to reduce network round trips:

```typescript
// Single pipeline execution
await cacheMSet([
  ['key1', data1, 300],
  ['key2', data2, 300],
  ['key3', data3, 300],
]);
```

### Pattern Invalidation

Pattern invalidation uses SCAN (not KEYS) for production safety:

```typescript
// Safe for production - uses SCAN with cursor
await cacheInvalidatePattern('feed:page:*');
```

## Monitoring

Key metrics to monitor:

1. **Cache Hit Rate**: `hits / (hits + misses)`
2. **Operation Latency**: P50, P95, P99 for get/set operations
3. **Error Rate**: Failed operations / total operations
4. **Memory Usage**: Redis memory consumption
5. **Eviction Rate**: Keys evicted due to memory pressure

## Troubleshooting

### Redis Connection Issues

```typescript
import { getRedis } from '@/lib/redis';

const redis = getRedis();
if (!redis) {
  console.error('Redis not available - check environment variables');
}
```

### High Memory Usage

```typescript
// Clear all caches (use with caution!)
import { cacheFlushAll } from '@/lib/redis';
await cacheFlushAll();
```

### Debugging Cache Keys

```typescript
// List all keys matching pattern (development only)
const redis = getRedis();
if (redis) {
  const keys = await redis.keys('guardian:scan:*');
  console.log('Guardian scan keys:', keys);
}
```

## Migration Guide

If migrating from the old cache implementation:

```typescript
// Old
import { cacheValue, getCachedValue } from '@/lib/redis/client';
await cacheValue('key', value, 300);
const cached = await getCachedValue('key');

// New
import { cacheSet, cacheGet, RedisKeys, RedisTTL } from '@/lib/redis';
await cacheSet(RedisKeys.guardianScan(id), value, { ttl: RedisTTL.guardianScan });
const result = await cacheGet(RedisKeys.guardianScan(id));
const cached = result.data;
```

## API Reference

See inline documentation in:
- `src/lib/redis/keys.ts` - Key namespace functions
- `src/lib/redis/cache.ts` - Cache operations
- `src/lib/redis/client.ts` - Redis client
- `src/lib/redis/index.ts` - Exports

## License

Part of the AlphaWhale Hunter Screen implementation.
