# Get HarvestPro Live Mode Working - FIXED (3 Steps)

## The Issue

The database tables don't exist yet. You need to run the migration first.

## Solution (3 Steps - 3 Minutes)

### Step 1: Check if Tables Exist (30 seconds)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `rebeznxivaxgserswhbn`
3. Click **SQL Editor** → **New Query**
4. Copy/paste: `supabase/seeds/00_check_and_run_migration.sql`
5. Click **Run**

**If you see ❌ marks**, continue to Step 2.
**If you see all ✅ marks**, skip to Step 3.

### Step 2: Run the Migration (1 minute)

1. In Supabase SQL Editor, click **New Query**
2. Copy/paste the ENTIRE contents of: `supabase/migrations/20250201000000_harvestpro_schema.sql`
3. Click **Run** (this will take ~10 seconds)
4. You should see: `Success. No rows returned`

This creates all the HarvestPro tables.

### Step 3: Seed Test Data (1 minute)

1. In Supabase SQL Editor, click **New Query**
2. Copy/paste: `supabase/seeds/01_harvestpro_test_data_fixed.sql`
3. Click **Run**

Expected output:
```
✅ Test data seeded successfully!
Total lots created: 4
Total opportunities: 4
Total potential loss: $10350
```

### Step 4: Test Live Mode (30 seconds)

1. Make sure you're logged in to your app
2. Go to HarvestPro: http://localhost:3003/harvest
3. Click **"Live"** button
4. You should see 4 opportunities load! 🎉

---

## What Gets Created

**4 Harvest Lots (positions with losses):**
- ETH: -$4,500 (60 days old, LOW RISK)
- MATIC: -$2,800 (90 days old, MEDIUM RISK)
- LINK: -$1,850 (45 days old, HIGH RISK)
- UNI: -$1,200 (120 days old, LOW RISK)

**4 Harvest Opportunities:**
- ETH: $1,080 net benefit
- MATIC: $672 net benefit
- LINK: $444 net benefit
- UNI: $288 net benefit

**Total:** $10,350 in losses → $2,484 in tax benefits

---

## Troubleshooting

### "relation harvest_lots does not exist"

You need to run the migration (Step 2).

### "No users found"

You need to sign up/log in to your app first.

### Still getting "Connection Error"

1. Make sure you're logged in
2. Check browser console for errors
3. Verify the migration ran successfully

### Want to Start Fresh?

```sql
-- Delete all test data
DELETE FROM harvest_opportunities;
DELETE FROM harvest_lots;

-- Then run Step 3 again
```

---

## Files to Use

1. **Check tables:** `supabase/seeds/00_check_and_run_migration.sql`
2. **Create tables:** `supabase/migrations/20250201000000_harvestpro_schema.sql`
3. **Seed data:** `supabase/seeds/01_harvestpro_test_data_fixed.sql`

Run them in this order!

---

## Summary

The original seed scripts had the wrong column names because they were written before checking the actual database schema. These fixed scripts match the real schema from the migration file.

After running these 3 steps, Live mode will work perfectly! 🚀
