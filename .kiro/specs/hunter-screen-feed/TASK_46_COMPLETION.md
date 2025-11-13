# Task 46 Completion: Implement Personalized Ranking with Wallet

## Status: ✅ COMPLETE

## Overview

Successfully implemented personalized ranking for the Hunter Screen feed based on wallet history and user preferences. The system now adjusts opportunity relevance scores using wallet activity data (completed opportunities, saved opportunities, preferred chains) to provide a tailored feed experience.

## Implementation Summary

### 1. Wallet History Service (`src/lib/wallet-history/index.ts`)

Created a comprehensive wallet history service that:
- Fetches wallet activity from multiple sources:
  - Completed opportunities (last 100)
  - Saved opportunities (last 100)
  - User preferences (preferred chains)
- Aggregates data into a unified `WalletHistory` object
- Caches results in Redis for 5 minutes
- Handles errors gracefully without blocking feed rendering
- Provides cache invalidation for real-time updates

**Key Functions:**
- `getWalletHistory(walletAddress, userId)` - Fetches and caches wallet history
- `invalidateWalletHistoryCache(walletAddress)` - Invalidates cache on updates

### 2. Personalized Ranking Algorithm (`src/lib/feed/personalized-ranking.ts`)

Implemented a sophisticated relevance scoring algorithm with weighted components:

**Relevance Weights (60% of total ranking):**
- Chain Match: 40% of relevance (24% of total)
  - Preferred chains: 1.0 score
  - History chains: 0.7-1.0 score
  - No match: 0.3 score (exploration)
- Type Match: 30% of relevance (18% of total)
  - Completed types: 1.0 score
  - Saved types: 0.7 score
  - No match: 0.5 score (exploration)
- Completion History: 20% of relevance (12% of total)
  - Based on engagement level (completion count)
  - Bonus for matching types
- Save History: 10% of relevance (6% of total)
  - Based on interest level (save count)
  - Bonus for matching types

**Overall Ranking Formula:**
```
rank_score = relevance(60%) + trust(25%) + freshness/urgency(15%)
```

**Key Functions:**
- `calculateRelevanceScore(opportunity, walletHistory)` - Calculates personalized relevance
- `applyPersonalizedRanking(opportunities, walletHistory)` - Applies ranking to opportunity list
- `getDefaultRankingBoost(opportunity)` - Provides cold-start ranking without wallet

### 3. Feed Query Integration (`src/lib/feed/query.ts`)

Updated `getFeedPage()` to support personalized ranking:
- Accepts `walletAddress` and `userId` parameters
- Fetches wallet history when wallet provided and sort is 'recommended'
- Applies personalized ranking before sponsored capping
- Falls back to default ranking if wallet history fetch fails (HTTP 429, timeout, etc.)
- Maintains cursor pagination and snapshot consistency

**Fallback Behavior:**
```typescript
try {
  walletHistory = await getWalletHistory(walletAddress, userId);
  usePersonalizedRanking = true;
} catch (error) {
  // Graceful fallback to cached anonymous ranking
  console.warn('Failed to fetch wallet history, falling back to default ranking');
  usePersonalizedRanking = false;
}
```

### 4. API Route Updates (`src/app/api/hunter/opportunities/route.ts`)

Enhanced the opportunities API endpoint to:
- Extract wallet address from `x-wallet-address` header
- Extract user ID from `x-user-id` header
- Pass both to `getFeedPage()` for personalization
- Maintain backward compatibility (works without wallet)

### 5. Hook Integration (`src/hooks/useHunterFeed.ts`)

Updated `useHunterFeed` hook to:
- Pass `activeWallet` to `getFeedPage()`
- Include `activeWallet` in React Query key (triggers refetch on wallet change)
- Show loading state during wallet switch
- Maintain infinite scroll with personalized ranking

### 6. Redis Keys Update (`src/lib/redis/keys.ts`)

Added wallet history cache key:
- `walletHistory(walletAddress)` - Cache key for wallet history
- TTL: 5 minutes (300 seconds)
- Pattern: `wallet:history:*` for bulk operations

## Testing

### Unit Tests

**Wallet History Service** (`src/__tests__/lib/wallet-history/index.test.ts`):
- ✅ Cache hit scenario
- ✅ Cache miss with database fetch
- ✅ Database error handling
- ✅ Works without user ID
- ✅ Cache invalidation
- ✅ Error handling for cache operations

**Personalized Ranking** (`src/__tests__/lib/feed/personalized-ranking.test.ts`):
- ✅ Relevance score calculation (16 tests)
- ✅ Chain matching (preferred vs history vs none)
- ✅ Type matching (completed vs saved vs none)
- ✅ Engagement level scoring
- ✅ Ranking application with tiebreakers
- ✅ Urgency boost in freshness component
- ✅ Default ranking boost for cold start
- ✅ Consistent ordering

### Integration Tests

**Personalized Ranking Integration** (`src/__tests__/lib/feed/personalized-ranking.integration.test.ts`):
- ✅ Applies personalized ranking when wallet provided
- ✅ Falls back to default ranking on wallet history fetch failure
- ✅ Skips personalization for non-recommended sorts
- ✅ Skips personalization when no wallet provided
- ✅ Handles timeout errors gracefully

**Test Results:**
```
✓ src/__tests__/lib/feed/personalized-ranking.test.ts (16 tests)
✓ src/__tests__/lib/wallet-history/index.test.ts (6 tests)
✓ src/__tests__/lib/feed/personalized-ranking.integration.test.ts (5 tests)

Total: 27 tests passed
```

## Requirements Verification

### ✅ Requirement 3.1-3.6: Personalized Ranking
- [x] 60% relevance, 25% trust, 15% freshness/urgency weights
- [x] Considers wallet chain history, completions, saves, preferred chains
- [x] Cold start ranking for non-connected wallets
- [x] Similar opportunities rank higher based on history
- [x] Trust tolerance and time budget preferences
- [x] Stable secondary sort (trust → expires_at → id)

### ✅ Requirement 17.4: Personalized Ranking Based on Wallet
- [x] Feed refreshes with personalized ranking when wallet connected
- [x] Wallet history fetched and cached
- [x] Relevance adjusted based on wallet activity
- [x] Fallback to default ranking on API pressure

### ✅ Requirement 18.4: Feed Refresh on Wallet Change
- [x] Active wallet included in React Query key
- [x] Feed automatically refetches when wallet changes
- [x] Loading state shown during wallet switch
- [x] Personalized ranking applied for new wallet

## Performance Considerations

### Caching Strategy
- **Wallet History**: 5-minute TTL in Redis
- **Feed Pages**: Personalized feeds bypass edge cache
- **Anonymous Feeds**: 5-minute edge cache with stale-while-revalidate

### Optimization Techniques
- Parallel database queries (completed + saved + preferences)
- Limit to last 100 items per category
- Redis cache-first approach
- Graceful degradation on errors
- Async operations throughout

### Fallback Behavior
- HTTP 429 (rate limit) → default ranking
- Timeout → default ranking
- Database error → empty history (neutral scoring)
- Cache error → fetch from database

## Documentation

Created comprehensive documentation:
- `src/lib/wallet-history/README.md` - Wallet history service guide
- Inline code comments throughout
- Test documentation with clear descriptions
- Integration examples in README

## API Changes

### New Parameters

**`getFeedPage()` function:**
```typescript
interface FeedQueryParams {
  // ... existing params
  walletAddress?: string; // For personalized ranking
  userId?: string; // For user preferences lookup
}
```

**API Headers:**
- `x-wallet-address` - Wallet address for personalization
- `x-user-id` - User ID for preferences lookup

### Backward Compatibility
- All new parameters are optional
- Works without wallet (default ranking)
- Existing API consumers unaffected

## Files Created

1. `src/lib/wallet-history/index.ts` - Wallet history service
2. `src/lib/wallet-history/README.md` - Documentation
3. `src/lib/feed/personalized-ranking.ts` - Ranking algorithm
4. `src/__tests__/lib/wallet-history/index.test.ts` - Unit tests
5. `src/__tests__/lib/feed/personalized-ranking.test.ts` - Unit tests
6. `src/__tests__/lib/feed/personalized-ranking.integration.test.ts` - Integration tests

## Files Modified

1. `src/lib/feed/query.ts` - Added personalization support
2. `src/lib/redis/keys.ts` - Added wallet history cache key
3. `src/app/api/hunter/opportunities/route.ts` - Extract wallet headers
4. `src/hooks/useHunterFeed.ts` - Pass wallet to API

## Next Steps

### Recommended Follow-ups
1. **A/B Testing Framework**: Test different relevance weights
2. **Machine Learning Model**: Train on user behavior for better predictions
3. **Time Decay**: Apply decay to older completions/saves
4. **Collaborative Filtering**: Recommend based on similar users
5. **Performance Monitoring**: Track personalization impact on engagement

### Monitoring Metrics
- Wallet history cache hit rate
- Personalization fetch latency
- Fallback rate (errors/timeouts)
- Engagement lift with personalization
- Relevance score distribution

## Conclusion

Task 46 is complete with full implementation of personalized ranking based on wallet history. The system:
- ✅ Fetches and caches wallet activity data
- ✅ Calculates personalized relevance scores
- ✅ Applies weighted ranking algorithm
- ✅ Falls back gracefully on errors
- ✅ Integrates seamlessly with existing feed
- ✅ Maintains performance with caching
- ✅ Includes comprehensive tests
- ✅ Provides detailed documentation

The personalized ranking system is production-ready and meets all specified requirements.
