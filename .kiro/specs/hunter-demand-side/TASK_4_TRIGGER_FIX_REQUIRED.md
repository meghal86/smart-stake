# Task 4: Database Trigger Fix Required

## Issue Summary

The airdrop seed script is failing with error:
```
record "new" has no field "opportunity_id"
```

## Root Cause

Two triggers are **incorrectly placed** on the `opportunities` table:

1. **`trg_check_auto_quarantine_after_ins_upd`**
   - Currently on: `opportunities` table ❌
   - Should be on: `report_events` table ✅
   - References: `NEW.opportunity_id` (which doesn't exist on opportunities)

2. **`trg_guardian_snapshot`** (via `apply_latest_guardian_snapshot` function)
   - Currently on: `opportunities` table ❌  
   - Should be on: `guardian_scans` table ✅
   - References: `NEW.opportunity_id` (which doesn't exist on opportunities)

## Why This Happened

These triggers were likely created by a migration that was later disabled or modified, but the triggers weren't properly cleaned up. The triggers reference `NEW.opportunity_id` which makes sense on tables like `report_events` and `guardian_scans` (which have an `opportunity_id` foreign key column), but NOT on the `opportunities` table itself (which has `id` as its primary key).

## Impact

- ❌ Cannot insert any records into `opportunities` table
- ❌ Airdrop seed script fails
- ❌ Yield seed script would fail
- ❌ Any opportunity creation fails

## Solution

Apply the fix migration: `supabase/migrations/20260128000002_fix_misplaced_triggers.sql`

This migration will:
1. Drop the misplaced triggers from `opportunities` table
2. Recreate them on the correct tables (`report_events` and `guardian_scans`)
3. Verify the fix was successful

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to: **SQL Editor** → **New Query**
3. Copy the contents of `supabase/migrations/20260128000002_fix_misplaced_triggers.sql`
4. Paste and run the SQL
5. Check the output for success messages:
   - ✅ All triggers successfully removed from opportunities table
   - ✅ Auto-quarantine trigger correctly placed on report_events table
   - ✅ Guardian snapshot trigger correctly placed on guardian_scans table

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
npx supabase db push

# Or apply specific migration
npx supabase migration up
```

### Option 3: Manual SQL Execution

If you have direct database access:

```bash
psql $DATABASE_URL < supabase/migrations/20260128000002_fix_misplaced_triggers.sql
```

## Verification

After applying the fix, verify it worked:

```bash
# Test the seed script
npm run seed:airdrops
```

**Expected Output:**
```
🌱 Seeding airdrops...

✅ Seeded: LayerZero Airdrop
✅ Seeded: zkSync Era Airdrop
✅ Seeded: Scroll Airdrop Season 1
... (12 total)

✅ Seeded 12 airdrops
✅ Airdrop seeding complete
```

Or run the diagnostic script:

```bash
npx tsx diagnose-seed-issue.ts
```

**Expected Output:**
```
3️⃣ Testing minimal insert...
✅ Insert successful!
✅ Cleaned up test record
```

## Database State Before Fix

```sql
-- Triggers on opportunities table (WRONG)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'opportunities';

-- Result:
-- trg_check_auto_quarantine_after_ins_upd | opportunities  ❌
```

## Database State After Fix

```sql
-- No triggers on opportunities table (CORRECT)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'opportunities';

-- Result: (empty) ✅

-- Triggers on correct tables
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trg_check_auto_quarantine_after_ins_upd', 'trg_guardian_snapshot');

-- Result:
-- trg_check_auto_quarantine_after_ins_upd | report_events   ✅
-- trg_guardian_snapshot                   | guardian_scans  ✅
```

## Next Steps After Fix

Once the fix is applied and verified:

1. ✅ Run seed scripts:
   ```bash
   npm run seed:airdrops
   npm run seed:quests
   npm run seed:points
   npm run seed:rwa
   ```

2. ✅ Run unit tests:
   ```bash
   npm test -- src/__tests__/unit/hunter-airdrop-eligibility.test.ts --run
   ```

3. ✅ Test API endpoints:
   ```bash
   # Test sync
   curl -X POST http://localhost:3000/api/sync/airdrops \
     -H "x-cron-secret: $CRON_SECRET"
   
   # Test feed
   curl http://localhost:3000/api/hunter/airdrops
   ```

4. ✅ Continue with Task 4 testing guide:
   - See: `.kiro/specs/hunter-demand-side/TASK_4_TESTING_GUIDE.md`

## Files Created

1. `supabase/migrations/20260128000002_fix_misplaced_triggers.sql` - The fix migration
2. `diagnose-seed-issue.ts` - Diagnostic script to verify the issue
3. This document - Explanation and instructions

## Related Issues

- Original fix attempt: `supabase/migrations/20260125000001_fix_opportunities_triggers.sql`
  - This migration dropped some triggers but missed the auto-quarantine trigger
  - The new migration is more comprehensive

## Prevention

To prevent this in the future:
1. Always verify trigger placement when creating them
2. Use explicit table names in trigger definitions
3. Test migrations in a staging environment first
4. Run diagnostic scripts after migrations

---

**Status**: 🔴 **FIX REQUIRED** - Apply migration before continuing with Task 4 testing

**Priority**: 🔥 **CRITICAL** - Blocks all opportunity seeding and creation

**Estimated Time**: 2 minutes to apply fix + 5 minutes to verify
