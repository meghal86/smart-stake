# Hunter Opportunity Sync - How Data Gets Updated

## Your Question

> "Why am I not passing wallet to find opportunities either real time or through db call? Because otherwise db will not update. How with any user wallet will opportunity be updated? Did we implement this or not?"

## The Answer: Two Separate Concerns

You're mixing two different concepts:

### 1. **Opportunity Data Population** (Database Updates)
- How opportunities get INTO the database
- Independent of any specific user's wallet
- Happens via scheduled sync jobs

### 2. **Personalized Feed** (User-Specific Filtering)
- How opportunities are FILTERED/RANKED for a specific wallet
- Happens when user requests the feed
- Uses wallet address to personalize results

## How Opportunities Get Into the Database

### Per Requirement 12: Data Refresh & Sync

**The `opportunities` table is populated by SCHEDULED SYNC JOBS**, not by user wallet queries:

```
Requirement 12: Data Refresh & Sync

1. WHEN live airdrops are synced THEN refresh SHALL occur hourly via /api/sync/airdrops
2. WHEN upcoming airdrops are synced THEN refresh SHALL occur every 4 hours via /api/sync/airdrops_upcoming
3. WHEN quests are synced THEN refresh SHALL occur hourly via /api/sync/quests
4. WHEN yield/staking data is synced THEN refresh SHALL occur every 2 hours via /api/sync/yield
5. WHEN points/loyalty data is synced THEN refresh SHALL occur daily via /api/sync/points
6. WHEN sponsored listings are created THEN they SHALL appear in real-time
7. WHEN community submissions are made THEN they SHALL require admin review before appearing
8. WHEN Guardian scans occur THEN results SHALL be reflected immediately
```

### Architecture: Sync Jobs → Database → User Queries

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC JOBS (Scheduled)                     │
│  Run independently, populate opportunities table             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /api/sync/airdrops (hourly)                                │
│  - Fetch from Layer3, Galxe, Zealy APIs                     │
│  - Insert/update opportunities table                         │
│  - No wallet address needed                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /api/sync/quests (hourly)                                  │
│  - Fetch from quest platforms                                │
│  - Insert/update opportunities table                         │
│  - No wallet address needed                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /api/sync/yield (every 2 hours)                            │
│  - Fetch from DeFiLlama, Yearn, etc.                        │
│  - Insert/update opportunities table                         │
│  - No wallet address needed                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              OPPORTUNITIES TABLE (Database)                  │
│  Contains ALL opportunities for ALL users                    │
│  - Airdrops (from Layer3, Galxe, etc.)                      │
│  - Quests (from quest platforms)                             │
│  - Yield (from DeFiLlama)                                    │
│  - Points (from loyalty programs)                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              USER QUERIES (On-Demand)                        │
│  Filter/rank opportunities for specific wallet               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  User A (wallet 0x1234...):                                  │
│  GET /api/hunter/opportunities?walletAddress=0x1234...      │
│  - Query opportunities table                                 │
│  - Filter by eligibility for wallet 0x1234                   │
│  - Rank by relevance to wallet 0x1234                        │
│  - Return personalized feed                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  User B (wallet 0x5678...):                                  │
│  GET /api/hunter/opportunities?walletAddress=0x5678...      │
│  - Query SAME opportunities table                            │
│  - Filter by eligibility for wallet 0x5678                   │
│  - Rank by relevance to wallet 0x5678                        │
│  - Return DIFFERENT personalized feed                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Insight: Opportunities are NOT Wallet-Specific

### ❌ WRONG Understanding
"Each wallet has its own opportunities in the database"
```sql
-- This is NOT how it works
SELECT * FROM opportunities WHERE wallet_address = '0x1234...';
```

### ✅ CORRECT Understanding
"All opportunities are in ONE table, filtered/ranked per wallet at query time"
```sql
-- Step 1: Sync jobs populate opportunities (no wallet)
INSERT INTO opportunities (title, type, protocol, chains, ...)
VALUES ('LayerZero Airdrop', 'airdrop', 'LayerZero', ARRAY['ethereum'], ...);

-- Step 2: User queries with wallet for personalization
SELECT * FROM opportunities 
WHERE status = 'published'
  AND (eligibility_for_wallet('0x1234...', id) = 'likely')  -- Filter by wallet
ORDER BY relevance_score_for_wallet('0x1234...', id) DESC;  -- Rank by wallet
```

## Implementation Status

### ✅ What EXISTS

1. **Database Schema** ✅
   - `opportunities` table exists
   - Columns for all opportunity data
   - Location: `supabase/migrations_disabled/20251023000100_hunter_tables.sql`

2. **Edge Function for Queries** ✅
   - `supabase/functions/hunter-opportunities/index.ts`
   - Queries opportunities table
   - Returns filtered/sorted results

### ❌ What's MISSING (Not Implemented)

1. **Sync Jobs** ❌
   - `/api/sync/airdrops` - Does NOT exist
   - `/api/sync/quests` - Does NOT exist
   - `/api/sync/yield` - Does NOT exist
   - `/api/sync/points` - Does NOT exist

2. **Scheduled Cron Jobs** ❌
   - No hourly airdrop sync
   - No hourly quest sync
   - No 2-hour yield sync
   - No daily points sync

3. **External API Integrations** ❌
   - No Layer3 API integration
   - No Galxe API integration
   - No Zealy API integration
   - No DeFiLlama API integration

4. **Wallet-Based Personalization** ❌
   - No eligibility filtering by wallet
   - No relevance ranking by wallet
   - Wallet address is passed but ignored

## Why You're Seeing Test Data

The database has **static test data** because:

1. ❌ No sync jobs are running to populate real opportunities
2. ❌ No external APIs are being called
3. ✅ Only manual test data was inserted for development

## How to Implement Proper Data Flow

### Step 1: Create Sync API Endpoints

**File:** `src/app/api/sync/airdrops/route.ts`
```typescript
export async function POST(req: NextRequest) {
  // Fetch from external APIs
  const airdrops = await fetchFromLayer3();
  const galxeAirdrops = await fetchFromGalxe();
  
  // Upsert into database
  for (const airdrop of [...airdrops, ...galxeAirdrops]) {
    await supabase.from('opportunities').upsert({
      slug: airdrop.slug,
      title: airdrop.title,
      type: 'airdrop',
      protocol: airdrop.protocol,
      chains: airdrop.chains,
      reward_min: airdrop.reward_min,
      reward_max: airdrop.reward_max,
      // ... other fields
    }, {
      onConflict: 'dedupe_key'  // Update if exists
    });
  }
  
  return NextResponse.json({ success: true, count: airdrops.length });
}
```

### Step 2: Create Scheduled Cron Jobs

**File:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/sync/airdrops",
      "schedule": "0 * * * *"  // Every hour
    },
    {
      "path": "/api/sync/quests",
      "schedule": "0 * * * *"  // Every hour
    },
    {
      "path": "/api/sync/yield",
      "schedule": "0 */2 * * *"  // Every 2 hours
    },
    {
      "path": "/api/sync/points",
      "schedule": "0 0 * * *"  // Daily
    }
  ]
}
```

### Step 3: Implement Wallet-Based Personalization

**File:** `src/app/api/hunter/opportunities/route.ts`
```typescript
export async function GET(req: NextRequest) {
  const walletAddress = searchParams.get('walletAddress');
  
  // Query all opportunities
  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'published');
  
  // If wallet provided, filter by eligibility
  if (walletAddress) {
    // Call eligibility service
    const eligibleIds = await getEligibleOpportunities(walletAddress);
    query = query.in('id', eligibleIds);
  }
  
  const { data } = await query;
  
  // If wallet provided, rank by relevance
  if (walletAddress && data) {
    const ranked = await rankByRelevance(data, walletAddress);
    return NextResponse.json({ items: ranked, ... });
  }
  
  return NextResponse.json({ items: data, ... });
}
```

## Summary

### Your Question: "Why am I not passing wallet to find opportunities?"

**Answer:** You ARE passing the wallet address (`walletAddress=0x3533...3330`), but:

1. ✅ **It's being passed correctly** in the API call
2. ❌ **It's NOT being used** because personalization isn't implemented
3. ❌ **The database has test data** because sync jobs don't exist

### The Real Issue

The `opportunities` table should be populated by **scheduled sync jobs** that:
- Run hourly/daily (independent of user requests)
- Fetch from external APIs (Layer3, Galxe, DeFiLlama)
- Insert/update opportunities for ALL users
- Don't need any wallet address

Then when a user queries with their wallet:
- Filter opportunities by eligibility for THAT wallet
- Rank opportunities by relevance to THAT wallet
- Return personalized feed

### What's Implemented

- ✅ Database schema
- ✅ Basic query endpoint
- ✅ Wallet address is passed
- ❌ Sync jobs (data population)
- ❌ Wallet personalization (filtering/ranking)

The test data you're seeing is static because no sync jobs are populating real opportunities from external sources.
