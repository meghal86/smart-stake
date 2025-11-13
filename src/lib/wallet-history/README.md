# Wallet History Service

This service fetches and caches wallet activity data for personalized ranking in the Hunter Screen feed.

## Overview

The wallet history service aggregates data from multiple sources to build a profile of user activity:
- Completed opportunities
- Saved opportunities  
- User preferences (preferred chains)
- Chain usage patterns
- Opportunity type preferences

This data is used by the personalized ranking algorithm to adjust opportunity relevance scores based on individual wallet behavior.

## Requirements

- **17.4**: Personalized ranking based on wallet history
- **18.4**: Feed refresh with personalized ranking on wallet change

## Usage

### Fetching Wallet History

```typescript
import { getWalletHistory } from '@/lib/wallet-history';

// Fetch wallet history for personalization
const walletHistory = await getWalletHistory(
  '0x1234...', // wallet address
  'user-uuid'  // optional user ID for preferences
);

console.log(walletHistory);
// {
//   walletAddress: '0x1234...',
//   chains: ['ethereum', 'base', 'arbitrum'],
//   completedTypes: ['airdrop', 'quest'],
//   savedTypes: ['yield', 'staking'],
//   preferredChains: ['ethereum', 'base'],
//   completedCount: 15,
//   savedCount: 8,
//   cachedAt: 1234567890
// }
```

### Invalidating Cache

When a user completes or saves an opportunity, invalidate the cache to ensure fresh data:

```typescript
import { invalidateWalletHistoryCache } from '@/lib/wallet-history';

// After completing an opportunity
await invalidateWalletHistoryCache(walletAddress);
```

## Data Sources

### 1. Completed Opportunities

Fetches the last 100 completed opportunities for the wallet/user:
- Extracts opportunity types
- Extracts chains used
- Counts total completions

### 2. Saved Opportunities

Fetches the last 100 saved opportunities for the wallet/user:
- Extracts opportunity types
- Extracts chains used
- Counts total saves

### 3. User Preferences

Fetches user preferences if user ID is provided:
- Preferred chains
- Trust tolerance
- Time budget preferences

## Caching Strategy

- **Cache Key**: `wallet:history:{walletAddress}`
- **TTL**: 5 minutes (300 seconds)
- **Storage**: Redis/Upstash KV
- **Invalidation**: Manual via `invalidateWalletHistoryCache()`

The cache ensures:
- Fast response times for repeated requests
- Reduced database load
- Fresh data within 5 minutes
- Immediate updates when explicitly invalidated

## Integration with Personalized Ranking

The wallet history is used by the personalized ranking algorithm to calculate relevance scores:

```typescript
import { applyPersonalizedRanking } from '@/lib/feed/personalized-ranking';
import { getWalletHistory } from '@/lib/wallet-history';

// Fetch wallet history
const walletHistory = await getWalletHistory(walletAddress, userId);

// Apply personalized ranking to opportunities
const rankedOpportunities = applyPersonalizedRanking(
  opportunities,
  walletHistory
);
```

## Relevance Scoring Weights

The wallet history contributes to the relevance component (60% of total ranking):

- **Chain Match**: 40% of relevance (24% of total)
  - Preferred chains: 1.0 score
  - History chains: 0.7-1.0 score
  - No match: 0.3 score (exploration)

- **Type Match**: 30% of relevance (18% of total)
  - Completed types: 1.0 score
  - Saved types: 0.7 score
  - No match: 0.5 score (exploration)

- **Completion History**: 20% of relevance (12% of total)
  - Based on engagement level (completions count)
  - Bonus for matching types

- **Save History**: 10% of relevance (6% of total)
  - Based on interest level (saves count)
  - Bonus for matching types

## Error Handling

The service includes graceful error handling:

1. **Database Errors**: Logged but don't throw, return empty arrays
2. **Cache Errors**: Logged but don't throw, fetch from database
3. **Missing Data**: Returns default values (empty arrays, zero counts)

This ensures the feed continues to work even if wallet history fetch fails.

## Fallback Behavior

If wallet history fetch fails (HTTP 429, timeout, etc.), the feed falls back to:
- Cached anonymous ranking (no personalization)
- Default ranking boost for high trust + easy + featured items
- Global trending opportunities

This is implemented in `getFeedPage()`:

```typescript
try {
  walletHistory = await getWalletHistory(walletAddress, userId);
  usePersonalizedRanking = true;
} catch (error) {
  // Fallback to cached anonymous ranking
  console.warn('Failed to fetch wallet history, falling back to default ranking');
  usePersonalizedRanking = false;
}
```

## Performance Considerations

- **Cache First**: Always check Redis cache before database
- **Batch Queries**: Fetch completed and saved opportunities in parallel
- **Limit Results**: Only fetch last 100 items per category
- **Async Operations**: All operations are async and non-blocking
- **Error Tolerance**: Failures don't block feed rendering

## Testing

See `src/__tests__/lib/wallet-history/` for unit and integration tests:
- Cache hit/miss scenarios
- Database query correctness
- Error handling
- Invalidation logic
- Integration with personalized ranking

## Future Enhancements

Potential improvements for future iterations:
- Machine learning model for relevance prediction
- Time-decay for older completions/saves
- Cross-wallet pattern detection
- Collaborative filtering (similar users)
- A/B testing framework for ranking weights
