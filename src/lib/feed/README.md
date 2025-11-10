# Feed Query Service

The feed query service provides cursor-based pagination and filtering for the Hunter Screen opportunity feed.

## Features

- **Cursor-based pagination**: Stable, opaque cursors prevent duplicates and flicker
- **Snapshot consistency**: All pages in a scroll session see consistent data
- **Comprehensive filtering**: Type, chains, trust, reward, urgency, difficulty, search
- **Sponsored capping**: Enforces ≤2 sponsored items per fold (12 cards)
- **Performance optimized**: Uses database indexes for fast queries (P95 < 200ms)

## Usage

### Basic Feed Query

```typescript
import { getFeedPage } from '@/lib/feed';

const result = await getFeedPage({
  limit: 12,
  trustMin: 80,
  sort: 'recommended',
});

console.log(result.items); // Array of opportunities
console.log(result.nextCursor); // Cursor for next page (or null)
console.log(result.snapshotTs); // Snapshot timestamp
```

### Paginated Feed Query

```typescript
import { getFeedPage } from '@/lib/feed';

// First page
const page1 = await getFeedPage({
  limit: 12,
  sort: 'recommended',
});

// Second page (using cursor from first page)
const page2 = await getFeedPage({
  limit: 12,
  sort: 'recommended',
  cursor: page1.nextCursor,
});

// All pages use the same snapshot timestamp
console.log(page1.snapshotTs === page2.snapshotTs); // true
```

### Filtered Feed Query

```typescript
import { getFeedPage } from '@/lib/feed';

const result = await getFeedPage({
  types: ['airdrop', 'quest'],
  chains: ['ethereum', 'base'],
  trustMin: 80,
  difficulty: ['easy', 'medium'],
  urgency: ['ending_soon', 'new'],
  rewardMin: 100,
  rewardMax: 10000,
  search: 'DeFi',
  sort: 'ends_soon',
  limit: 12,
});
```

### Show Risky Opportunities

```typescript
import { getFeedPage } from '@/lib/feed';

// By default, red trust items (score < 60) are hidden
const safeOnly = await getFeedPage({
  showRisky: false, // default
  trustMin: 80,
});

// Enable red trust items with explicit consent
const withRisky = await getFeedPage({
  showRisky: true,
  trustMin: 0, // Show all trust levels
});
```

### Count Opportunities

```typescript
import { countOpportunities } from '@/lib/feed';

const total = await countOpportunities({
  types: ['airdrop'],
  chains: ['ethereum'],
  trustMin: 80,
});

console.log(`Found ${total} opportunities`);
```

## API Reference

### `getFeedPage(params: FeedQueryParams): Promise<FeedPageResult>`

Fetches a page of opportunities with cursor-based pagination.

**Parameters:**

- `search?: string` - Search term for title, protocol, or description
- `types?: OpportunityType[]` - Filter by opportunity types
- `chains?: Chain[]` - Filter by blockchain chains
- `trustMin?: number` - Minimum trust score (0-100, default: 80)
- `rewardMin?: number` - Minimum reward amount
- `rewardMax?: number` - Maximum reward amount
- `urgency?: UrgencyType[]` - Filter by urgency (ending_soon, new, hot)
- `eligibleOnly?: boolean` - Show only likely eligible opportunities
- `difficulty?: DifficultyLevel[]` - Filter by difficulty (easy, medium, advanced)
- `sort?: SortOption` - Sort order (recommended, ends_soon, highest_reward, newest, trust)
- `showRisky?: boolean` - Include red trust items (default: false)
- `cursor?: string` - Pagination cursor from previous page
- `limit?: number` - Page size (default: 12)
- `walletAddress?: string` - Wallet address for eligibility filtering

**Returns:**

```typescript
{
  items: Opportunity[];        // Array of opportunities
  nextCursor: string | null;   // Cursor for next page (null if last page)
  snapshotTs: number;          // Snapshot timestamp (UNIX seconds)
  totalCount?: number;         // Total count of matching items
}
```

### `countOpportunities(params): Promise<number>`

Counts total opportunities matching filters (without pagination).

**Parameters:** Same as `getFeedPage` except `cursor` and `limit`.

**Returns:** Total count of matching opportunities.

## Sorting Options

- `recommended` (default): trust_score DESC, expires_at ASC, id ASC
- `ends_soon`: expires_at ASC, trust_score DESC, id ASC
- `highest_reward`: reward_max DESC, trust_score DESC, id ASC
- `newest`: published_at DESC, trust_score DESC, id ASC
- `trust`: trust_score DESC, expires_at ASC, id ASC

## Sponsored Item Capping

The feed enforces a maximum of 2 sponsored items per fold (12 cards) to comply with requirement 4.16.

The capping is applied server-side during query processing:
1. Fetch more items than needed (limit + 10)
2. Apply sponsored capping algorithm
3. Take only the requested limit
4. Generate cursor from last item

This ensures deterministic behavior across all viewport sizes and prevents sponsored clustering at page boundaries.

## Snapshot Consistency

All pages in a scroll session use the same snapshot timestamp to prevent duplicates and flicker:

1. **First page**: Creates a new snapshot timestamp
2. **Subsequent pages**: Extract snapshot from cursor
3. **Query constraint**: `updated_at <= snapshot_ts`

This ensures that new opportunities published during scrolling don't appear until a new session starts.

## Performance

The feed query is optimized for performance:

- **Target**: P95 < 200ms on 100k rows
- **Indexes**: Multicolumn and partial indexes on opportunities table
- **Cursor pagination**: Efficient keyset pagination (no OFFSET)
- **Sponsored capping**: Applied in-memory after fetch

## Testing

See `src/__tests__/lib/feed/query.test.ts` for comprehensive test coverage:

- Cursor pagination stability
- Filter application
- Sponsored capping
- Deduplication across pages
- Snapshot consistency
- Sort order correctness

## Requirements Coverage

- **3.7**: Cursor-based pagination with stable ordering
- **4.1-4.12**: Comprehensive filtering (type, chains, trust, reward, urgency, difficulty, search)
- **4.16**: Sponsored item capping (≤2 per fold)
- **4.19**: Deterministic sponsored placement
- **7.9**: Deduplication across pages

## Related Modules

- `@/lib/cursor` - Cursor encoding/decoding utilities
- `@/types/hunter` - Type definitions
- `@/integrations/supabase/service` - Supabase service client
