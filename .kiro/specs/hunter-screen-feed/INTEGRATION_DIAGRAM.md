# Hunter Screen UI Integration with Ranking API

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Hunter.tsx (Page)                         │
│                                                                  │
│  • Manages UI state (filters, modals, theme)                   │
│  • Implements infinite scroll trigger (70% threshold)           │
│  • Renders OpportunityCard components                           │
│  • Handles loading/empty states                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ useHunterFeed({
                         │   filter: 'All',
                         │   sort: 'recommended',
                         │   isDemo: false
                         │ })
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   useHunterFeed Hook                             │
│                                                                  │
│  • Manages React Query infinite query                           │
│  • Transforms filters to API params                             │
│  • Flattens pages while maintaining order                       │
│  • Transforms Opportunity → LegacyOpportunity                   │
│  • Provides: opportunities[], fetchNextPage(), hasNextPage      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ getFeedPage({
                         │   types: ['airdrop'],
                         │   sort: 'recommended',
                         │   cursor: 'base64...',
                         │   limit: 12
                         │ })
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   getFeedPage() Service                          │
│                                                                  │
│  • Decodes cursor or creates snapshot                           │
│  • Queries mv_opportunity_rank materialized view                │
│  • Applies filters (type, chains, trust, etc.)                  │
│  • Applies sorting (rank_score, trust, expires_at, id)         │
│  • Enforces sponsored capping (≤2 per fold)                     │
│  • Generates next cursor with snapshot_ts                       │
│  • Returns: { items, nextCursor, snapshotTs }                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ SELECT * FROM mv_opportunity_rank
                         │ WHERE status='published'
                         │   AND updated_at <= snapshot_ts
                         │   AND trust_score >= 80
                         │ ORDER BY rank_score DESC, ...
                         │ LIMIT 12
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              mv_opportunity_rank (Materialized View)             │
│                                                                  │
│  • Precomputed rank_score for each opportunity                  │
│  • rank_score = relevance(60%) + trust(25%) + freshness(15%)   │
│  • Includes: relevance, trust_weighted, freshness_weighted     │
│  • Refreshes every 2-5 minutes via cron                         │
│  • Filters out expired items automatically                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Joins with:
                         │ - opportunities table
                         │ - guardian_scans table
                         │ - user activity data
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Tables                               │
│                                                                  │
│  • opportunities: Core opportunity data                         │
│  • guardian_scans: Trust scores and security flags             │
│  • user_preferences: User settings and preferences             │
│  • saved_opportunities: User saved items                        │
│  • analytics_events: User interaction tracking                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
User Scrolls to 70%
        │
        ▼
Hunter.tsx detects scroll position
        │
        ▼
Calls fetchNextPage()
        │
        ▼
useHunterFeed executes query with cursor
        │
        ▼
getFeedPage() fetches next page
        │
        ├─ Decodes cursor: [rank_score, trust_score, expires_at, id, snapshot_ts]
        │
        ├─ Queries mv_opportunity_rank with cursor filter
        │
        ├─ Applies sponsored capping (≤2 per 12 items)
        │
        └─ Generates next cursor with same snapshot_ts
        │
        ▼
Returns { items: Opportunity[], nextCursor: string, snapshotTs: number }
        │
        ▼
useHunterFeed transforms to LegacyOpportunity[]
        │
        ▼
Hunter.tsx renders new OpportunityCard components
        │
        ▼
User sees more opportunities in ranked order
```

## Cursor Pagination Flow

```
Session Start
     │
     ▼
Create snapshot_ts = now()
     │
     ▼
Page 1: cursor = null
     │
     ├─ Query: WHERE updated_at <= snapshot_ts
     │          ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC
     │          LIMIT 12
     │
     ├─ Last item: { rank_score: 95, trust_score: 90, expires_at: '2025-01-10', id: 'abc' }
     │
     └─ Generate cursor: encodeCursor([95, 90, '2025-01-10', 'abc', snapshot_ts])
     │
     ▼
Page 2: cursor = 'base64...'
     │
     ├─ Decode: [95, 90, '2025-01-10', 'abc', snapshot_ts]
     │
     ├─ Query: WHERE updated_at <= snapshot_ts
     │          AND (rank_score, trust_score, expires_at, id) < (95, 90, '2025-01-10', 'abc')
     │          ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC
     │          LIMIT 12
     │
     ├─ Last item: { rank_score: 88, trust_score: 85, expires_at: '2025-01-12', id: 'def' }
     │
     └─ Generate cursor: encodeCursor([88, 85, '2025-01-12', 'def', snapshot_ts])
     │
     ▼
Page 3: cursor = 'base64...'
     │
     └─ Continue with same snapshot_ts...

Key Benefits:
✓ No duplicates (snapshot_ts prevents new items from appearing mid-scroll)
✓ No flicker (ranking changes don't affect current session)
✓ Stable ordering (cursor includes all sort keys)
✓ Efficient queries (indexed on rank_score, trust_score, expires_at, id)
```

## Filter Integration Flow

```
User Changes Filter
        │
        ▼
Hunter.tsx updates activeFilter state
        │
        ▼
useHunterFeed receives new filter prop
        │
        ▼
mapFilterToType() converts to OpportunityType[]
        │
        ├─ 'All' → []
        ├─ 'Staking' → ['staking', 'yield']
        ├─ 'Airdrops' → ['airdrop']
        └─ 'Quests' → ['quest']
        │
        ▼
React Query detects queryKey change
        │
        ▼
Invalidates cache and refetches
        │
        ▼
getFeedPage() applies type filter
        │
        ├─ WHERE type IN ('airdrop')
        │
        └─ Still uses rank_score for ordering
        │
        ▼
Returns filtered opportunities in ranked order
        │
        ▼
Hunter.tsx renders filtered results
```

## Sort Options Flow

```
User Selects Sort Option
        │
        ▼
useHunterFeed receives sort prop
        │
        ▼
getFeedPage() applies sort logic
        │
        ├─ 'recommended' → ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC
        │
        ├─ 'ends_soon' → ORDER BY expires_at ASC, rank_score DESC, trust_score DESC, id ASC
        │
        ├─ 'highest_reward' → ORDER BY reward_max DESC, rank_score DESC, trust_score DESC, id ASC
        │
        ├─ 'newest' → ORDER BY published_at DESC, rank_score DESC, trust_score DESC, id ASC
        │
        └─ 'trust' → ORDER BY trust_score DESC, rank_score DESC, expires_at ASC, id ASC
        │
        ▼
All sort options use rank_score as secondary sort
        │
        ▼
Ensures consistent ordering even when primary sort has ties
```

## Sponsored Capping Flow

```
getFeedPage() fetches 22 items (12 + 10 buffer)
        │
        ▼
applySponsoredCapping() processes items
        │
        ├─ Initialize: result = [], sponsoredCount = 0
        │
        ├─ For each item:
        │   │
        │   ├─ If sponsored:
        │   │   │
        │   │   ├─ If sponsoredCount < 2:
        │   │   │   ├─ Add to result
        │   │   │   └─ Increment sponsoredCount
        │   │   │
        │   │   └─ Else: Skip item
        │   │
        │   └─ If not sponsored:
        │       └─ Add to result
        │
        └─ Return first 12 items
        │
        ▼
Result: ≤2 sponsored items per 12-item fold
```

## Transformation Layer

```
Database Row (mv_opportunity_rank)
        │
        ├─ id: 'abc123'
        ├─ type: 'staking'
        ├─ trust_score: 90
        ├─ trust_level: 'green'
        ├─ apr: 4.2
        └─ ...
        │
        ▼
transformRowToOpportunity()
        │
        ▼
Opportunity (New Format)
        │
        ├─ id: 'abc123'
        ├─ type: 'staking'
        ├─ trust: { score: 90, level: 'green', ... }
        ├─ apr: 4.2
        └─ ...
        │
        ▼
transformToLegacyOpportunity()
        │
        ▼
LegacyOpportunity (UI Format)
        │
        ├─ id: 'abc123'
        ├─ type: 'Staking'
        ├─ guardianScore: 9
        ├─ riskLevel: 'Low'
        ├─ reward: '4.2% APY'
        └─ ...
        │
        ▼
OpportunityCard renders with legacy format
```

## Key Integration Points

### 1. Ranking Algorithm
- **Location:** `mv_opportunity_rank` materialized view
- **Formula:** `rank_score = relevance(60%) + trust(25%) + freshness(15%)`
- **Refresh:** Every 2-5 minutes via cron job
- **Performance:** P95 < 200ms via precomputed scores

### 2. Cursor Pagination
- **Location:** `src/lib/cursor.ts`
- **Format:** `[rank_score, trust_score, expires_at, id, snapshot_ts]`
- **Encoding:** Base64url for URL safety
- **Stability:** Snapshot watermark prevents duplicates/flicker

### 3. Filter Integration
- **Location:** `useHunterFeed` hook
- **Mapping:** Legacy filters → OpportunityType[]
- **Caching:** React Query with 60s stale time
- **Persistence:** URL query params (handled by Hunter.tsx)

### 4. Transformation Layer
- **Location:** `useHunterFeed` hook
- **Purpose:** Backward compatibility with existing UI
- **Mapping:** New Opportunity → LegacyOpportunity
- **Validation:** All 12 tests passing

## Performance Characteristics

| Metric | Value | Implementation |
|--------|-------|----------------|
| API P95 Latency | < 200ms | Materialized view with indexes |
| Page Size | 12 items | One fold |
| Prefetch Trigger | 70% scroll | Hunter.tsx scroll handler |
| Cache Stale Time | 60s | React Query config |
| Cache GC Time | 5min | React Query config |
| Ranking Refresh | 2-5min | Cron job |
| Cursor Size | ~100 bytes | Base64url encoded tuple |

## Error Handling

```
API Error
    │
    ▼
getFeedPage() throws error
    │
    ▼
React Query catches error
    │
    ▼
useHunterFeed returns error state
    │
    ▼
Hunter.tsx shows error UI
    │
    ├─ Toast notification with retry button
    ├─ Cached results if available
    └─ Empty state with helpful message
```

## Real-time Updates

```
realTimeEnabled: true
        │
        ▼
React Query enables polling
        │
        ├─ refetchInterval: 30000 (30s)
        │
        ├─ Refetches in background
        │
        └─ Updates UI when new data arrives
        │
        ▼
User sees fresh opportunities without manual refresh
```

---

**Last Updated:** January 7, 2025  
**Status:** ✅ Production Ready  
**Test Coverage:** 12/12 tests passing
