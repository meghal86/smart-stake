# Guardian Console Error Fixes ✅

## Issues Found

Based on your console errors, here's what was wrong and what I fixed:

### 🔴 Issue 1: 404 on API Endpoint

**Error:**
```
POST http://localhost:8083/api/guardian/scan 404 (Not Found)
```

**Root Cause:**
The existing `guardianService.ts` was trying to call `/api/guardian/scan`, but this is a **Vite app**, not Next.js. Vite doesn't have an `/api` directory. The Guardian implementation uses **Supabase Edge Functions** instead.

**Fix Applied:** ✅
Updated `src/services/guardianService.ts` to call the correct Supabase Edge Function:

```typescript
// OLD (broken):
const response = await fetch('/api/guardian/scan', { ... });

// NEW (fixed):
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const functionUrl = `${supabaseUrl}/functions/v1/guardian-scan`;
const response = await fetch(functionUrl, { ... });
```

**File Changed:** `src/services/guardianService.ts` (line 226-254)

---

### 🔴 Issue 2: 404 on guardian_scans Table

**Error:**
```
GET https://...supabase.co/rest/v1/guardian_scans?select=* 404 (Not Found)
```

**Root Cause:**
The `guardian_scans` table/view doesn't exist yet because the database migration hasn't been run.

**Fix Required:** ⏳ (You need to do this)

Run the migration:
```bash
supabase db push
```

Or manually execute: `supabase/migrations/20251022000001_guardian_tables.sql`

**Why:** The migration creates:
- `users` table
- `scans` table
- `user_preferences` table
- `guardian_scans` view (used for fallback queries)

---

### 🔴 Issue 3: Edge Functions Not Deployed

**Error:**
```
Guardian API responded with status 404
```

**Root Cause:**
The Supabase Edge Functions haven't been deployed yet, so the endpoint doesn't exist.

**Fix Required:** ⏳ (You need to do this)

Deploy the functions:
```bash
supabase functions deploy guardian-scan
supabase functions deploy guardian-revoke
supabase functions deploy guardian-healthz
```

**Why:** These are serverless functions that run the scan logic.

---

### 🟡 Issue 4: React Key Warning (Unrelated to Guardian)

**Error:**
```
Warning: Encountered two children with the same key, `predictions`
```

**Root Cause:**
This is from `MobileBottomNav.tsx` (not Guardian-related). Two nav items have the same key.

**Fix:** (Optional - not blocking Guardian)
Find and fix duplicate keys in `src/components/shell/MobileBottomNav.tsx` around line 79.

---

### 🟡 Issue 5: Badge Ref Warning (Unrelated to Guardian)

**Error:**
```
Warning: Function components cannot be given refs. Attempts to access this ref will fail.
```

**Root Cause:**
`Badge` component needs `forwardRef` wrapper.

**Fix:** (Optional - not blocking Guardian)
Wrap Badge component with `React.forwardRef()` in `src/components/ui/badge.tsx`.

---

## ✅ What's Working Now

After my fixes:

1. ✅ **Service Updated:** Now calls correct Supabase Edge Function URL
2. ✅ **Fallback Working:** When API fails, returns mock data (so UI works immediately)
3. ✅ **All Components:** Ready to display real data once functions are deployed
4. ✅ **Scripts Created:** Setup and test scripts to make deployment easy

## 🚀 Next Steps (In Order)

### Option A: Full Setup (Production Ready)

1. **Set Environment Variable**
   ```bash
   # Add to .env.local
   VITE_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
   ```

2. **Run Migration**
   ```bash
   supabase db push
   ```

3. **Deploy Functions**
   ```bash
   supabase functions deploy guardian-scan
   supabase secrets set ALCHEMY_API_KEY=your-key
   supabase secrets set ETHERSCAN_API_KEY=your-key
   ```

4. **Test**
   ```bash
   npm run dev
   # Navigate to http://localhost:8080/guardian
   ```

### Option B: Quick Test (Mock Data)

If you just want to see the UI working:

1. **Set Environment Variable**
   ```bash
   # Add to .env.local
   VITE_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
   ```

2. **Restart Dev Server**
   ```bash
   npm run dev
   ```

3. **Navigate to Guardian**
   - Go to: `http://localhost:8080/guardian`
   - Click "Connect Wallet"
   - See mock scan results (Trust Score 87)

The service will fall back to mock data when the API/DB aren't available yet. This lets you test the UI immediately!

---

## 📋 Summary

| Issue | Status | Action Required |
|-------|--------|----------------|
| Wrong API URL | ✅ Fixed | None - already fixed |
| Missing table | ⏳ Pending | Run migration |
| Missing functions | ⏳ Pending | Deploy functions |
| React warnings | 🟡 Optional | Fix later (not blocking) |

## 🎯 Current State

**Frontend:** 100% Ready ✅
**Backend Setup:** 0% Complete ⏳
**Mock Data:** Works immediately ✅

You can test the Guardian UI right now with mock data, then deploy the backend when ready for real scans.

---

## 📚 Helper Files Created

1. **`GUARDIAN_QUICKSTART.md`** - Step-by-step setup guide
2. **`setup-guardian.sh`** - Automated setup script
3. **`test-guardian-local.sh`** - Test functions locally
4. **This file** - Explains what was fixed

---

## 🔧 How to Use Scripts

```bash
# Make scripts executable (already done)
chmod +x setup-guardian.sh test-guardian-local.sh

# Run full setup
./setup-guardian.sh

# Or test locally first
./test-guardian-local.sh
```

---

## 💡 Pro Tip

The Guardian is designed to gracefully degrade:

```
Real API → Supabase Fallback → Mock Data
```

So even without deploying anything, you can:
1. Test the UI
2. Review the components
3. See the flow
4. Deploy backend when ready

**No blockers to seeing it in action!** 🎉

---

**Questions?** Check `GUARDIAN_README.md` for full documentation.

