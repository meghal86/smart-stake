# Hunter Live Mode - ROOT CAUSE FOUND ✅

## TL;DR

**The database migrations exist but are DISABLED!**

They're in `supabase/migrations_disabled/` instead of `supabase/migrations/`.

---

## Discovery

```bash
$ find . -name "*hunter*schema*" -o -name "*ranking*view*"

# Found:
./supabase/migrations_disabled/20250104000003_hunter_ranking_view.sql  ← HERE!
./supabase/migrations_disabled/20250104000000_hunter_screen_schema.sql  ← HERE!
./scripts/verify-ranking-view.sql
./scripts/validate-hunter-schema.js
```

**The migrations are disabled, so they were never applied to your database!**

---

## Why No Network Calls

1. **Code is correct** ✅
   - `useHunterFeed` hook properly detects `isDemo=false`
   - `getFeedPage()` function correctly queries Supabase
   - Query key includes `isDemo` parameter

2. **Database is empty** ❌
   - Migrations are in `migrations_disabled/` folder
   - Never applied to database
   - Tables don't exist: `opportunities`, `mv_opportunity_rank`

3. **Silent fallback** ⚠️
   - Supabase query fails (table doesn't exist)
   - Error caught internally
   - Falls back to mock data
   - No visible network call

---

## The Fix

### Option 1: Enable Migrations (Recommended)

```bash
# Move migrations from disabled to active
mv supabase/migrations_disabled/20250104000000_hunter_screen_schema.sql supabase/migrations/
mv supabase/migrations_disabled/20250104000003_hunter_ranking_view.sql supabase/migrations/

# Apply migrations
supabase db push

# Or manually
psql $DATABASE_URL -f supabase/migrations/20250104000000_hunter_screen_schema.sql
psql $DATABASE_URL -f supabase/migrations/20250104000003_hunter_ranking_view.sql
```

### Option 2: Keep Disabled, Use Demo Mode

If the migrations are disabled for a reason (e.g., not ready for production):

```typescript
// Keep demo mode ON until database is ready
// src/pages/Hunter.tsx
const [isDemo, setIsDemo] = useState(true); // Keep true
```

---

## Why Were They Disabled?

Possible reasons:
1. **Work in progress** - Schema not finalized
2. **Testing** - Avoiding accidental production deployment
3. **Dependencies** - Waiting for other features
4. **Data migration** - Need to migrate existing data first

**Check with your team** before enabling!

---

## Verification After Enabling

### Step 1: Check Tables Exist

```sql
-- Connect to database
psql $DATABASE_URL

-- Check tables
\dt opportunities
\dm mv_opportunity_rank

-- Check data
SELECT COUNT(*) FROM opportunities;
SELECT COUNT(*) FROM mv_opportunity_rank;
```

### Step 2: Seed Sample Data

```sql
-- Insert test opportunities
INSERT INTO opportunities (
  slug, title, protocol_name, type, chains,
  reward_min, reward_max, reward_currency,
  trust_score, trust_level, difficulty, status, published_at
) VALUES
  ('eth-staking', 'Ethereum 2.0 Staking', 'Lido', 'staking', ARRAY['ethereum'],
   0, 4.2, 'APY', 90, 'green', 'easy', 'published', NOW()),
  ('layerzero-airdrop', 'LayerZero Airdrop', 'LayerZero', 'airdrop', ARRAY['ethereum', 'arbitrum'],
   500, 2000, 'USD', 78, 'amber', 'medium', 'published', NOW()),
  ('uniswap-quest', 'Uniswap V4 Beta', 'Uniswap', 'quest', ARRAY['ethereum'],
   0, 0, 'NFT', 88, 'green', 'easy', 'published', NOW());

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_opportunity_rank;

-- Verify
SELECT * FROM mv_opportunity_rank LIMIT 5;
```

### Step 3: Test Live Mode

1. Hard refresh browser (`Ctrl+Shift+R`)
2. Navigate to `/hunter`
3. Toggle demo mode OFF
4. Open DevTools → Network tab
5. Look for Supabase API calls
6. Verify opportunities display

**Expected console output:**
```
🎯 Hunter Feed Mode: {isDemo: false, useRealAPI: true, ...}
🔴 LIVE MODE ACTIVE - Will fetch from API
🌐 Live Mode: Fetching from API
✅ API Response: {itemCount: 3, hasMore: false, ...}
```

**Expected Network calls:**
```
POST https://your-project.supabase.co/rest/v1/mv_opportunity_rank
Status: 200 OK
Response: {items: [...], nextCursor: null, snapshotTs: ...}
```

---

## Summary

### ✅ What's Working
- UI components
- React hooks
- Query key fix
- Demo mode
- Mock data

### ❌ What's Missing
- Database tables (migrations disabled)
- Sample data
- Live API integration

### 🎯 Next Steps

**Immediate:**
1. Check why migrations are disabled
2. Decide: enable or keep demo mode
3. If enabling: move files and apply migrations
4. Seed sample data
5. Test live mode

**Estimated time:** 15-30 minutes

---

## Files to Review

1. **Disabled migrations:**
   - `supabase/migrations_disabled/20250104000000_hunter_screen_schema.sql`
   - `supabase/migrations_disabled/20250104000003_hunter_ranking_view.sql`

2. **Validation scripts:**
   - `scripts/validate-hunter-schema.js`
   - `scripts/verify-ranking-view.sql`

3. **Code (already correct):**
   - `src/hooks/useHunterFeed.ts`
   - `src/lib/feed/query.ts`
   - `src/pages/Hunter.tsx`

---

## Decision Tree

```
Are migrations intentionally disabled?
├─ YES → Keep demo mode ON until ready
│         Document why disabled
│         Set timeline for enabling
│
└─ NO → Enable migrations now
         ├─ Move files to migrations/
         ├─ Apply to database
         ├─ Seed sample data
         └─ Test live mode
```

---

**Last Updated**: 2026-01-20  
**Status**: ROOT CAUSE IDENTIFIED - Migrations are disabled  
**Action Required**: Decide whether to enable migrations or keep demo mode
