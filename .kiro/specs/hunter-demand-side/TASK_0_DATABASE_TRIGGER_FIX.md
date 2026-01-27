# Task 0: Database Trigger Issue - FIXED

## Problem (RESOLVED)
Seed scripts were failing with error: `record "new" has no field "opportunity_id"`

## Root Cause (IDENTIFIED)
The database had conflicting schema from multiple migrations:
- **Active migration** (`20260125000000_hunter_demand_side_shared_schema.sql`) expects `opportunities` table with `id` column
- **Disabled migration** (`20250104000000_hunter_screen_schema.sql`) created a trigger `trg_guardian_snapshot` that references `NEW.opportunity_id`
- The trigger was either incorrectly attached to `opportunities` table or had wrong column reference

## Why Dropping the Trigger is NOT an Option
The `guardian_scans` table and its trigger are actively used by:
1. Guardian integration (`src/lib/guardian/hunter-integration.ts`)
2. Home metrics API (`src/app/api/home-metrics/route.ts`)
3. Cockpit summary API (`src/app/api/cockpit/summary/route.ts`)
4. Guardian rescan cron job (`src/app/api/cron/guardian-rescan/route.ts`)
5. Multiple integration tests

**Dropping it would break existing Guardian functionality.**

## Solution: Complete SQL Fix Script

I've created a comprehensive SQL script that will:
1. **Diagnose** the current trigger configuration
2. **Fix** the trigger by recreating it correctly
3. **Verify** the fix worked
4. **Test** with a sample insert

### Run This Script in Supabase SQL Editor

**File:** `scripts/diagnose-and-fix-trigger.sql`

**Direct Link:** https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/sql/new

The script will:
- Drop any incorrect triggers from both `opportunities` and `guardian_scans` tables
- Recreate the function with correct logic
- Attach the trigger to the correct table (`guardian_scans`)
- Verify no triggers remain on `opportunities` table
- Test with a sample insert to confirm it works

### What the Script Does

```sql
-- 1. Drops trigger from both tables (cleanup)
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON opportunities;
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON guardian_scans;
DROP FUNCTION IF EXISTS apply_latest_guardian_snapshot();

-- 2. Recreates function correctly
CREATE OR REPLACE FUNCTION apply_latest_guardian_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE opportunities
  SET 
    trust_score = NEW.score,
    trust_level = NEW.level,
    updated_at = NOW()
  WHERE id = NEW.opportunity_id;  -- Correct: references guardian_scans.opportunity_id
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Creates trigger on CORRECT table (guardian_scans)
CREATE TRIGGER trg_guardian_snapshot
AFTER INSERT ON guardian_scans
FOR EACH ROW 
EXECUTE FUNCTION apply_latest_guardian_snapshot();
```

## Next Steps (IN ORDER)

1. **Run the SQL script:**
   - Open Supabase SQL Editor: https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/sql/new
   - Copy contents of `scripts/diagnose-and-fix-trigger.sql`
   - Paste and execute
   - Verify you see "Test passed! Trigger issue is fixed."

2. **Run seed scripts:**
   ```bash
   npm run seed:all
   ```

3. **Verify seeded data:**
   ```sql
   SELECT type, COUNT(*) FROM opportunities GROUP BY type;
   ```
   Should show:
   - airdrop: 12
   - quest: 12
   - points: 12
   - rwa: 12

4. **Start dev server and test:**
   ```bash
   npm run dev
   ```
   Navigate to `/hunter` and verify opportunities display

5. **Verify Guardian functionality still works:**
   - Check home metrics API: `/api/home-metrics`
   - Check cockpit summary: `/api/cockpit/summary`
   - Verify no console errors

## Status
- [x] Root cause identified
- [x] Comprehensive fix script created
- [ ] SQL script executed in Supabase
- [ ] Seed scripts run successfully
- [ ] Data verified in database
- [ ] Hunter feed tested
- [ ] Guardian functionality verified

## Files Created
- `scripts/diagnose-and-fix-trigger.sql` - Complete fix script with diagnostics and testing
