# 🚨 ACTION REQUIRED: Database Trigger Fix

## Current Situation

✅ **Task 0 is 100% complete** - All code, configuration, and documentation done  
⚠️ **BLOCKED** - Cannot run seed scripts due to database trigger issue  
⏱️ **5 minutes** to unblock and proceed

## What You Need to Do

### Step 1: Open Supabase SQL Editor (1 minute)

Click this link: https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/sql/new

### Step 2: Run the Fix Script (2 minutes)

1. Open the file: `scripts/diagnose-and-fix-trigger.sql`
2. Copy **ALL** contents (entire file)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button

### Step 3: Verify Success (30 seconds)

You should see this message at the bottom:
```
✅ Test passed! Trigger issue is fixed.
✅ Trigger fix complete! You can now run: npm run seed:all
```

If you see any errors, **STOP** and share the error message.

### Step 4: Seed the Database (1 minute)

Run this command in your terminal:
```bash
npm run seed:all
```

Expected output:
```
✓ Seeded 12 airdrop opportunities
✓ Seeded 12 quest opportunities
✓ Seeded 12 points programs
✓ Seeded 12 RWA vaults
✓ Total: 48 opportunities seeded
```

### Step 5: Test Hunter Feed (30 seconds)

```bash
npm run dev
```

Open browser: http://localhost:5173/hunter

You should see 48 opportunities displayed.

## What This Fixes

**The Problem:**
- Database trigger `trg_guardian_snapshot` was incorrectly configured
- Seed scripts fail with: `record "new" has no field "opportunity_id"`
- This blocks all Hunter development

**The Solution:**
- Drops incorrect trigger from `opportunities` table
- Recreates trigger correctly on `guardian_scans` table
- Preserves existing Guardian functionality
- Allows seed scripts to run successfully

## Why This Happened

Two migrations created conflicting schema:
1. **Active migration** uses `id` as primary key
2. **Disabled migration** created trigger expecting `opportunity_id`
3. Trigger ended up on wrong table or with wrong column reference

## What Happens After This

Once you complete these 5 steps:

1. ✅ Database trigger fixed
2. ✅ 48 opportunities seeded (12 of each type)
3. ✅ Hunter feed displays opportunities
4. ✅ Ready to start **Task 1: Shared Foundations**

## Next Task Preview

**Task 1: Shared Foundations** (Property-based tests)
- Wallet Signals Service (get wallet age, tx count, balances)
- Eligibility Engine (evaluate if wallet qualifies)
- Ranking Engine (sort opportunities by relevance)

Estimated time: 2-3 hours

## Files Reference

### Fix Script
- `scripts/diagnose-and-fix-trigger.sql` - Complete SQL fix

### Documentation
- `.kiro/specs/hunter-demand-side/QUICK_START_GUIDE.md` - Step-by-step guide
- `.kiro/specs/hunter-demand-side/TASK_0_DATABASE_TRIGGER_FIX.md` - Technical details
- `.kiro/specs/hunter-demand-side/TASK_0_FINAL_STATUS.md` - Complete status report

### Seed Scripts (Ready to Run)
- `scripts/seed-airdrops.ts` - 12 airdrop opportunities
- `scripts/seed-quests.ts` - 12 quest opportunities
- `scripts/seed-points.ts` - 12 points programs
- `scripts/seed-rwa.ts` - 12 RWA vaults

## Support

If anything goes wrong:

1. **SQL script fails:**
   - Copy the exact error message
   - Share it for help
   - Do NOT proceed to seed scripts

2. **Seed scripts fail:**
   - Check if SQL script ran successfully
   - Verify you see "Test passed!" message
   - Share the seed script error

3. **Hunter feed empty:**
   - Check browser console for errors
   - Verify data exists: `SELECT COUNT(*) FROM opportunities;`
   - Should return 48 rows

## Summary

**What's Done:** Everything except running one SQL script  
**What's Needed:** You run the SQL script (5 minutes)  
**What's Next:** Task 1 - Shared Foundations (2-3 hours)

---

**Ready?** Open Supabase SQL Editor and run `scripts/diagnose-and-fix-trigger.sql`
