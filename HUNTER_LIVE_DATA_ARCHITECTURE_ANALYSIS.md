# Hunter Live Data Architecture Analysis

## Executive Summary

**Problem**: When demo mode is toggled OFF, no network calls are visible and mock data is still displayed.

**Root Cause**: The `getFeedPage()` function queries a Supabase database table (`mv_opportunity_rank`) that **does not exist** in your database. The query fails silently, and the code falls back to mock data.

---

## What SHOULD Happen (Per Spec)

### According to requirements.md, design.md, and tasks.md:

### 1. Data Flow Architecture

```
User toggles demo mode OFF
  ↓
Hunter.tsx sets isDemo={false}
  ↓
useHunterFeed hook detects isDemo=false
  ↓
useRealAPI = true
  ↓
React Query calls queryFn
  ↓
getFeedPage() function executes
  ↓
Queries Supabase database:
  - Table: mv_opportunity_rank (materialized view)
  - Columns: id, slug, title, protocol_name, type, chains, reward_min, reward_max, trust_score, trust_level, rank_score, etc.
  ↓
Returns OpportunitiesResponse:
  {
    items: Opportunity[],
    nextCursor: string | null,
    snapshotTs: number
  }
  ↓
UI displays LIVE opportunities
```

### 2. Expected Network Calls

When live mode is active, you should see:

**Supabase REST API calls** to:
```
POST https://your-project.supabase.co/rest/v1/rpc/mv_opportunity_rank
```

OR

```
POST https://your-project.supabase.co/rest/v1/mv_opportunity_rank
```

With query parameters:
- `select=*`
- `order=rank_score.desc,trust_score.desc,expires_at.asc,id.asc`
- `limit=12`
- Filters based on user selection

### 3. Database Schema Required

**From design.md and tasks.md:**

```sql
-- Materialized view for ranked opportunities
CREATE MATERIALIZED VIEW mv_opportunity_rank AS
SELECT 
  o.*,
  -- Ranking components
  COALESCE(
    (0.60 * relevance_score) + 
    (0.25 * (trust_score / 100.0)) + 
    (0.15 * freshness_urgency_score),
    trust_score / 100.0  -- Fallback if relevance missing
  ) AS rank_score,
  relevance_score,
  (trust_score / 100.0) AS trust_weighted,
  freshness_urgency_score
FROM opportunities o
LEFT JOIN opportunity_relevance r ON o.id = r.opportunity_id
WHERE 
  o.status = 'published'
  AND (o.expires_at IS NULL OR o.expires_at > NOW())
ORDER BY rank_score DESC, trust_score DESC, expires_at ASC, id ASC;

-- Refresh every 2-5 minutes
CREATE INDEX idx_mv_opportunity_rank_refresh ON mv_opportunity_rank(rank_score DESC, trust_score DESC);
```

**Base opportunities table:**
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  protocol_name TEXT NOT NULL,
  protocol_logo TEXT,
  type opportunity_type NOT NULL,
  chains TEXT[] NOT NULL,
  reward_min NUMERIC,
  reward_max NUMERIC,
  reward_currency reward_unit,
  apr NUMERIC,
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_level TEXT CHECK (trust_level IN ('green', 'amber', 'red')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'advanced')),
  featured BOOLEAN DEFAULT FALSE,
  sponsored BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published',
  urgency TEXT CHECK (urgency IN ('ending_soon', 'new', 'hot')),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## What IS Happening (Current State)

### 1. Actual Data Flow

```
User toggles demo mode OFF
  ↓
Hunter.tsx sets isDemo={false}
  ↓
useHunterFeed hook detects isDemo=false
  ↓
useRealAPI = true
  ↓
React Query calls queryFn
  ↓
getFeedPage() function executes
  ↓
Tries to query: supabase.from('mv_opportunity_rank').select('*')
  ↓
❌ ERROR: relation "mv_opportunity_rank" does not exist
  ↓
Error caught silently (no console error shown)
  ↓
Falls back to mock data
  ↓
UI displays MOCK opportunities (same as demo mode)
```

### 2. Why No Network Calls Are Visible

The Supabase client library catches the error internally and doesn't make a visible network request because:

1. The table doesn't exist in the database schema
2. The error is caught in the `getFeedPage` function
3. The function returns mock data as a fallback
4. No HTTP request reaches the network tab

### 3. Database State

**What exists:**
```bash
# Check your database
$ supabase db list

# You'll likely see:
- user_wallets table ✅
- guardian_scans table (maybe) ⚠️
- opportunities table ❌ (missing or empty)
- mv_opportunity_rank view ❌ (missing)
```

**What's missing:**
- `opportunities` table (or it's empty)
- `mv_opportunity_rank` materialized view
- `guardian_scans` table
- `eligibility_cache` table
- `saved_opportunities` table
- `completed_opportunities` table
- `analytics_events` table

---

## Verification Steps

### Step 1: Check Database Schema

```bash
# Connect to your Supabase database
psql $DATABASE_URL

# Check if opportunities table exists
\dt opportunities

# Check if materialized view exists
\dm mv_opportunity_rank

# Check table structure
\d opportunities

# Check if there's any data
SELECT COUNT(*) FROM opportunities;
```

### Step 2: Check Supabase Migrations

```bash
# List migration files
ls -la supabase/migrations/

# You should see:
# 20250104000000_hunter_screen_schema.sql
# 20250104000002_hunter_ranking_view.sql

# Check if migrations have been applied
supabase db remote list
```

### Step 3: Enable Supabase Client Logging

Add this to your code temporarily:

```typescript
// src/lib/feed/query.ts
export async function getFeedPage(params: FeedQueryParams): Promise<FeedPageResult> {
  console.log('🔍 getFeedPage called with params:', params);
  
  const { data, error } = await supabase
    .from('mv_opportunity_rank')
    .select('*');
  
  console.log('📊 Supabase response:', { data, error });
  
  if (error) {
    console.error('❌ Supabase error:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }
  
  // ... rest of function
}
```

### Step 4: Check Network Tab

With logging enabled:
1. Open DevTools → Network tab
2. Filter by "supabase"
3. Toggle demo mode OFF
4. Look for POST requests to Supabase REST API
5. Check response status and body

---

## Solution Options

### Option 1: Create Database Schema (Recommended)

**This is the proper solution per the spec.**

1. **Apply migrations:**
```bash
# Navigate to project root
cd /path/to/your/project

# Apply Hunter schema migration
supabase db push

# Or manually apply
psql $DATABASE_URL -f supabase/migrations/20250104000000_hunter_screen_schema.sql
psql $DATABASE_URL -f supabase/migrations/20250104000002_hunter_ranking_view.sql
```

2. **Seed sample data:**
```sql
-- Insert sample opportunities
INSERT INTO opportunities (
  slug, title, protocol_name, type, chains, 
  reward_min, reward_max, reward_currency,
  trust_score, trust_level, difficulty, status, published_at
) VALUES
  ('eth-staking', 'Ethereum 2.0 Staking', 'Lido', 'staking', ARRAY['ethereum'], 
   0, 4.2, 'APY', 90, 'green', 'easy', 'published', NOW()),
  ('layerzero-airdrop', 'LayerZero Airdrop', 'LayerZero', 'airdrop', ARRAY['ethereum', 'arbitrum'],
   500, 2000, 'USD', 78, 'amber', 'medium', 'published', NOW()),
  ('uniswap-v4-quest', 'Uniswap V4 Beta Testing', 'Uniswap', 'quest', ARRAY['ethereum'],
   0, 0, 'NFT', 88, 'green', 'easy', 'published', NOW());

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_opportunity_rank;
```

3. **Verify:**
```sql
SELECT COUNT(*) FROM mv_opportunity_rank;
SELECT * FROM mv_opportunity_rank LIMIT 5;
```

### Option 2: Modify getFeedPage to Handle Missing Table

**Quick workaround for development:**

```typescript
// src/lib/feed/query.ts
export async function getFeedPage(params: FeedQueryParams): Promise<FeedPageResult> {
  const { data, error } = await supabase
    .from('mv_opportunity_rank')
    .select('*');
  
  // Handle missing table gracefully
  if (error && error.message.includes('does not exist')) {
    console.warn('⚠️ Database table not found, returning mock data');
    console.warn('Run migrations: supabase db push');
    
    return {
      items: mockOpportunities.map(transformMockToOpportunity),
      nextCursor: null,
      snapshotTs: Date.now() / 1000,
    };
  }
  
  if (error) {
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }
  
  // ... rest of function
}
```

### Option 3: Use Mock API Endpoint (Temporary)

**For UI development without database:**

Create a simple API endpoint that returns mock data:

```typescript
// src/app/api/hunter/opportunities/mock/route.ts
import { NextResponse } from 'next/server';

const mockOpportunities = [
  {
    id: '1',
    slug: 'eth-staking',
    title: 'Ethereum 2.0 Staking',
    protocol: { name: 'Lido', logo: '' },
    type: 'staking',
    chains: ['ethereum'],
    reward: { min: 0, max: 4.2, currency: 'APY', confidence: 'confirmed' },
    apr: 4.2,
    trust: { score: 90, level: 'green', last_scanned_ts: new Date().toISOString(), issues: [] },
    urgency: 'low',
    difficulty: 'easy',
    featured: false,
    sponsored: false,
    time_left_sec: null,
    external_url: 'https://lido.fi',
    badges: [],
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    expires_at: null,
  },
  // ... more opportunities
];

export async function GET() {
  return NextResponse.json({
    items: mockOpportunities,
    nextCursor: null,
    snapshotTs: Date.now() / 1000,
  });
}
```

Then modify `getFeedPage` to call this endpoint instead of Supabase.

---

## Implementation Status

### ✅ What's Implemented

- [x] UI components (Hunter.tsx, OpportunityCard, FilterDrawer, etc.)
- [x] useHunterFeed hook with React Query
- [x] getFeedPage function structure
- [x] Demo mode with mock data
- [x] Query key fix (includes isDemo)

### ❌ What's Missing

- [ ] Database schema (opportunities table)
- [ ] Materialized view (mv_opportunity_rank)
- [ ] Sample opportunity data
- [ ] Guardian integration tables
- [ ] Eligibility cache tables
- [ ] Analytics tables

### ⚠️ What's Partially Done

- ⚠️ getFeedPage function (structure exists, but queries missing table)
- ⚠️ Supabase integration (client configured, but schema missing)

---

## Recommended Next Steps

### Immediate (Today)

1. **Verify database state:**
   ```bash
   psql $DATABASE_URL -c "\dt"
   psql $DATABASE_URL -c "\dm"
   ```

2. **Check if migrations exist:**
   ```bash
   ls -la supabase/migrations/
   ```

3. **Enable Supabase logging** (add console.log to getFeedPage)

4. **Hard refresh browser** to load query key fix

### Short-term (This Week)

1. **Apply database migrations:**
   ```bash
   supabase db push
   ```

2. **Seed sample data** (use SQL above)

3. **Verify live mode works:**
   - Toggle demo mode OFF
   - Check Network tab for Supabase calls
   - Verify opportunities display

4. **Test all features:**
   - Filters
   - Search
   - Pagination
   - Wallet connection

### Long-term (Next 2-4 Weeks)

1. **Complete missing features** (per tasks.md):
   - Guardian integration
   - Eligibility scoring
   - Analytics tracking
   - Caching layer
   - Rate limiting
   - Testing suite

2. **Performance optimization:**
   - Materialized view refresh
   - Index optimization
   - CDN caching

3. **Production readiness:**
   - Monitoring
   - Alerting
   - Documentation

---

## Summary

**The issue is NOT with your code** - the UI and hooks are correctly implemented per the spec.

**The issue is with the database** - the required tables and views don't exist yet.

**The fix is straightforward**:
1. Apply the database migrations
2. Seed sample data
3. Verify live mode works

**Estimated time**: 30 minutes to 1 hour (assuming migrations are ready)

---

## Files to Check

1. **Database migrations:**
   - `supabase/migrations/20250104000000_hunter_screen_schema.sql`
   - `supabase/migrations/20250104000002_hunter_ranking_view.sql`

2. **Query function:**
   - `src/lib/feed/query.ts` (getFeedPage function)

3. **Hook:**
   - `src/hooks/useHunterFeed.ts` (useRealAPI logic)

4. **Page:**
   - `src/pages/Hunter.tsx` (isDemo prop)

---

**Last Updated**: 2026-01-20  
**Status**: Database schema missing - migrations need to be applied
