# Hunter Demand-Side: Quick Start Guide

## Current Status
✅ Task 0 complete - All environment setup done
⚠️ **BLOCKED** - Database trigger issue preventing seed scripts from running

## What You Need to Do RIGHT NOW

### Step 1: Fix Database Trigger (5 minutes)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/sql/new

2. **Copy and paste this entire script:**
   - Open file: `scripts/diagnose-and-fix-trigger.sql`
   - Copy ALL contents
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify success:**
   - You should see: "Test passed! Trigger issue is fixed."
   - If you see any errors, copy them and ask for help

### Step 2: Seed Database (2 minutes)

```bash
# Run all seed scripts at once
npm run seed:all
```

**Expected output:**
```
✓ Seeded 12 airdrop opportunities
✓ Seeded 12 quest opportunities  
✓ Seeded 12 points programs
✓ Seeded 12 RWA vaults
✓ Total: 48 opportunities seeded
```

### Step 3: Verify Data (1 minute)

Run this in Supabase SQL Editor:
```sql
SELECT type, COUNT(*) FROM opportunities GROUP BY type;
```

**Expected result:**
```
type     | count
---------|------
airdrop  | 12
quest    | 12
points   | 12
rwa      | 12
```

### Step 4: Test Hunter Feed (2 minutes)

```bash
# Start dev server
npm run dev
```

1. Open browser: http://localhost:5173/hunter
2. You should see 48 opportunities in the feed
3. Verify they display correctly with:
   - Protocol logos
   - Reward amounts
   - Trust scores
   - Action buttons

## What If Something Goes Wrong?

### Seed Scripts Fail
**Error:** `record "new" has no field "opportunity_id"`
- **Fix:** You didn't run Step 1 (SQL script). Go back and run it.

**Error:** `duplicate key value violates unique constraint`
- **Fix:** Data already exists. Run this to clear:
  ```sql
  DELETE FROM opportunities WHERE source = 'internal';
  ```
  Then run `npm run seed:all` again.

### No Opportunities Show in Hunter Feed
1. Check browser console for errors
2. Check network tab - is `/api/hunter/opportunities` returning data?
3. Verify data exists: `SELECT COUNT(*) FROM opportunities;`

### Guardian Functionality Broken
**Symptoms:** Home page or Cockpit showing errors
- **Fix:** The trigger fix should preserve Guardian functionality
- **Verify:** Check these endpoints work:
  - `/api/home-metrics`
  - `/api/cockpit/summary`

## Next Steps After This Works

Once you complete Steps 1-4 successfully:

1. **Task 1: Shared Foundations** (Property-based tests)
   - Wallet Signals Service
   - Eligibility Engine  
   - Ranking Engine

2. **Task 2: Airdrop Module** (First opportunity type)

3. **Task 3: Quest Module**

4. **Task 4: Points Module**

5. **Task 5: RWA Module**

## Environment Variables (Already Configured)

✅ All set in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALCHEMY_API_KEY`
- `ZEALY_API_KEY`
- `CRON_SECRET`

## Key Files Reference

- **Seed scripts:** `scripts/seed-*.ts`
- **Environment validation:** `src/lib/hunter/env-validation.ts`
- **Hunter schema:** `supabase/migrations/20260125000000_hunter_demand_side_shared_schema.sql`
- **API endpoint:** `src/app/api/hunter/opportunities/route.ts`
- **Hunter page:** `src/pages/Hunter.tsx`

## Support

If you get stuck:
1. Check the error message carefully
2. Look in the relevant file from "Key Files Reference"
3. Ask for help with the specific error message

---

**Remember:** The ONLY blocker right now is the database trigger. Once you run that SQL script, everything else should work smoothly.
