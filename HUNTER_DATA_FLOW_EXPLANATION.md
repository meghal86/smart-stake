# Hunter Data Flow - Complete Explanation

## Current Status: ✅ Live Mode Working

You're seeing the API call which means live mode is functioning correctly!

```
http://localhost:8088/api/hunter/opportunities?filter=All&sort=recommended&limit=12&walletAddress=0x353394b8fe89e9d52ba5c3d463b863f82c383330
```

## Data Flow Architecture

### Current Implementation (Quick Fix)

```
User toggles demo mode OFF
  ↓
useHunterFeed hook (src/hooks/useHunterFeed.ts)
  ↓
fetch('/api/hunter/opportunities')
  ↓
Next.js API Route (src/app/api/hunter/opportunities/route.ts)
  ↓
Supabase Client queries 'opportunities' table
  ↓
Returns data: { items: [...], cursor: null, ts: "..." }
  ↓
UI displays opportunities
```

### Proper Architecture (Per Requirements)

```
User toggles demo mode OFF
  ↓
useHunterFeed hook
  ↓
fetch('/api/hunter/opportunities')
  ↓
Next.js API Route (thin proxy)
  ↓
Supabase Edge Function: hunter-opportunities ← EXISTS!
  ↓
Database query with ranking
  ↓
Returns ranked opportunities
```

## Database Schema

### Opportunities Table

**Location:** `supabase/migrations_disabled/20251023000100_hunter_tables.sql`

**Schema:**
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  protocol TEXT NOT NULL,
  type TEXT CHECK (type IN ('airdrop','quest','staking','yield')),
  chains TEXT[] NOT NULL,
  
  -- Rewards
  reward_min NUMERIC,
  reward_max NUMERIC,
  reward_currency TEXT CHECK (reward_currency IN ('USD','ETH','POINTS')),
  reward_confidence TEXT CHECK (reward_confidence IN ('confirmed','estimated','speculative')),
  
  -- Difficulty & time
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
  time_required TEXT,
  
  -- Safety (cached from Guardian)
  trust_score INT DEFAULT 100,
  is_verified BOOLEAN DEFAULT FALSE,
  audited BOOLEAN DEFAULT FALSE,
  
  -- Timeline
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  urgency TEXT CHECK (urgency IN ('high','medium','low')),
  
  -- Requirements
  requirements JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  
  -- Categorization
  category TEXT[],
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  
  -- Live stats
  participants INTEGER,
  apr NUMERIC,
  apy NUMERIC,
  tvl_usd NUMERIC,
  
  -- Media
  thumbnail TEXT,
  banner TEXT,
  protocol_logo TEXT,
  
  -- Source metadata
  source TEXT,
  source_ref TEXT,
  protocol_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## How Data Gets Into the Database

### Option 1: Supabase Edge Function (EXISTS!)

**File:** `supabase/functions/hunter-opportunities/index.ts`

This Edge Function:
- ✅ Queries the `opportunities` table
- ✅ Applies filters (type, chains, difficulty, search)
- ✅ Sorts by featured + created_at
- ✅ Basic ranking by reward + trust_score
- ✅ Pagination (20 items per page)
- ✅ Rate limiting (60 requests/hour)

**How to use it:**
```bash
# Call the Edge Function directly
curl -X POST https://your-project.supabase.co/functions/v1/hunter-opportunities \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filters": {"type": "airdrop"}}'
```

### Option 2: Manual Data Entry

You can insert opportunities directly into the database:

```sql
INSERT INTO opportunities (
  slug, title, protocol, type, chains,
  reward_min, reward_max, reward_currency,
  difficulty, trust_score, featured
) VALUES (
  'uniswap-v4-testnet',
  'Uniswap V4 Testnet Quest',
  'Uniswap',
  'quest',
  ARRAY['ethereum', 'base'],
  100,
  500,
  'POINTS',
  'easy',
  95,
  true
);
```

### Option 3: Data Ingestion Scripts

You can create scripts to fetch opportunities from external sources:

```typescript
// scripts/ingest-opportunities.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fetch from external API (e.g., Layer3, Galxe, Zealy)
const opportunities = await fetchFromExternalAPI();

// Insert into database
for (const opp of opportunities) {
  await supabase.from('opportunities').upsert({
    slug: opp.slug,
    title: opp.title,
    protocol: opp.protocol,
    type: opp.type,
    chains: opp.chains,
    // ... other fields
  });
}
```

### Option 4: Admin Panel (Future)

Create an admin interface to manually add/edit opportunities.

## Why You're Seeing Airdrops

The opportunities you're seeing are **real data from your database**, not mock data.

### To Check What's in Your Database

```sql
-- Check if opportunities table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'opportunities'
);

-- Count opportunities
SELECT COUNT(*) FROM opportunities;

-- View all opportunities
SELECT id, title, type, protocol, trust_score, featured, created_at 
FROM opportunities 
ORDER BY created_at DESC;

-- View airdrops specifically
SELECT id, title, protocol, reward_min, reward_max, reward_currency
FROM opportunities 
WHERE type = 'airdrop'
ORDER BY created_at DESC;
```

### If Table is Empty

If the `opportunities` table is empty or doesn't exist, you need to:

1. **Run the migration:**
   ```bash
   # Copy from migrations_disabled to migrations
   cp supabase/migrations_disabled/20251023000100_hunter_tables.sql supabase/migrations/
   
   # Apply migration
   supabase db push
   ```

2. **Seed with sample data:**
   ```sql
   -- Insert sample opportunities
   INSERT INTO opportunities (slug, title, protocol, type, chains, reward_min, reward_max, reward_currency, difficulty, trust_score, featured)
   VALUES
   ('layerzero-airdrop', 'LayerZero Airdrop', 'LayerZero', 'airdrop', ARRAY['ethereum', 'arbitrum'], 500, 2000, 'USD', 'medium', 78, true),
   ('uniswap-v4-quest', 'Uniswap V4 Beta Testing', 'Uniswap', 'quest', ARRAY['ethereum'], 0, 0, 'POINTS', 'easy', 88, true),
   ('lido-staking', 'Ethereum 2.0 Staking', 'Lido', 'staking', ARRAY['ethereum'], 0, 0, 'ETH', 'easy', 95, false);
   ```

## Current vs. Proper Implementation

### What's Working Now (Quick Fix)

✅ **Next.js API Route** queries database directly
- Simple query: `SELECT * FROM opportunities WHERE status = 'published'`
- Basic sorting by `created_at DESC`
- No ranking algorithm
- No personalization
- No eligibility filtering

### What Should Happen (Proper Architecture)

The **Supabase Edge Function** (`hunter-opportunities`) should be called:
- ✅ Already exists at `supabase/functions/hunter-opportunities/index.ts`
- ✅ Has rate limiting
- ✅ Has basic ranking (reward + trust_score)
- ✅ Has pagination
- ✅ Has filtering

**To use the Edge Function instead:**

Update `src/app/api/hunter/opportunities/route.ts`:
```typescript
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Call Edge Function instead of direct query
  const { data, error } = await supabase.functions.invoke('hunter-opportunities', {
    body: {
      filters: {
        type: searchParams.get('filter'),
        page: parseInt(searchParams.get('page') || '1'),
        wallet: searchParams.get('walletAddress'),
      }
    }
  });
  
  if (error) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: error.message } }, { status: 500 });
  }
  
  return NextResponse.json({
    items: data.data.opportunities,
    cursor: data.data.hasMore ? `page-${data.data.page + 1}` : null,
    ts: new Date().toISOString()
  });
}
```

## Wallet Address Parameter

The `walletAddress` parameter is being passed but **not used yet** because:

### Current Behavior
- ❌ No personalized ranking based on wallet history
- ❌ No eligibility filtering
- ❌ Shows all published opportunities regardless of wallet

### Future Behavior (When Implemented)
- ✅ Analyze wallet's chain history
- ✅ Filter by "Likely Eligible" based on wallet signals
- ✅ Rank opportunities by relevance to wallet
- ✅ Show personalized recommendations

## Summary

### ✅ What's Working
1. Live mode makes API calls
2. Data is fetched from database
3. Opportunities display on screen
4. Demo mode toggle works both ways

### ⚠️ What's Not Implemented Yet
1. Personalized ranking based on wallet
2. Eligibility filtering
3. Guardian trust score integration
4. Proper cursor pagination
5. Caching layer
6. Analytics tracking

### 📊 Data Source
- **Demo Mode:** Hardcoded mock data (5 opportunities)
- **Live Mode:** Real data from `opportunities` table in Supabase

### 🔧 Next Steps

1. **Verify database has data:**
   ```sql
   SELECT COUNT(*) FROM opportunities;
   ```

2. **If empty, seed with sample data** (see SQL above)

3. **Optional: Use existing Edge Function** instead of direct query

4. **Future: Implement full ranking system** (Tasks 9, 9a, 11)

The airdrops you're seeing are real database records, not personalized to your wallet yet. This is expected behavior for the Quick Fix implementation.
