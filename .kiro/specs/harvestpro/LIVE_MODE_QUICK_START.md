# HarvestPro Live Mode - Quick Start (2 Minutes)

## TL;DR

1. **Log in** to your app
2. **Run** `supabase/seeds/harvestpro_test_data.sql` in Supabase SQL Editor
3. **Click** "Live" mode in HarvestPro
4. **Done!** You should see 4 real opportunities

---

## Step-by-Step Guide

### Step 1: Log In (30 seconds)

Go to your app and sign in:
```
http://localhost:3003
```

If you don't have an account, sign up with any email/password.

### Step 2: Seed Test Data (1 minute)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `rebeznxivaxgserswhbn`
3. Go to **SQL Editor** → **New Query**
4. Copy/paste: `supabase/seeds/harvestpro_test_data.sql`
5. Click **Run**

Expected output:
```
✅ Test data seeded successfully!
✅ Total lots created: 4
✅ Total potential loss: $10,350
```

### Step 3: Test Live Mode (30 seconds)

1. Go to HarvestPro: http://localhost:3003/harvest
2. Click **"Live"** button in header
3. Wait for loading...
4. See 4 opportunities appear! 🎉

### Step 4: Test the Modal

1. Click **"Start Harvest"** on any card
2. Modal opens with full details ✅
3. Click **"Execute Harvest"** to test the flow

---

## Verification

### How to Know It's Working

**Demo Mode (3 mock opportunities):**
- ETH: $4,500 loss
- MATIC: $2,800 loss  
- LINK: $1,850 loss

**Live Mode (4 real opportunities):**
- ETH: $4,500 loss
- MATIC: $2,800 loss
- LINK: $1,850 loss
- UNI: $1,200 loss ← **New one!**

If you see UNI, you're in Live mode! ✅

### Check Setup Status

Run this in Supabase SQL Editor:
```sql
-- Copy/paste: supabase/seeds/check_harvestpro_setup.sql
```

Should show all ✅ checkmarks.

---

## Troubleshooting

### Still Getting "Connection Error"?

**Quick Fix:**
1. Make sure you're logged in (check top-right corner)
2. Open browser console (F12)
3. Run:
```javascript
const { data } = await supabase.auth.getUser();
console.log('Logged in:', !!data.user);
```

If `false`, log in first!

### "No Opportunities Detected"?

This means the API is working but no data exists.

**Quick Fix:**
1. Run `check_harvestpro_setup.sql` to verify
2. If checks fail, run `harvestpro_test_data.sql` again
3. Make sure you're logged in as the same user

### Network Tab Shows 401 Error?

You're not authenticated.

**Quick Fix:**
1. Log out
2. Log back in
3. Try "Live" mode again

---

## What You Get

After setup, Live mode will show:

**4 Harvest Opportunities:**
1. **ETH** - $4,500 loss → $1,080 net benefit (LOW RISK)
2. **MATIC** - $2,800 loss → $672 net benefit (MEDIUM RISK)
3. **LINK** - $1,850 loss → $444 net benefit (HIGH RISK)
4. **UNI** - $1,200 loss → $288 net benefit (LOW RISK)

**Total:** $10,350 in losses → $2,484 in tax benefits

All with:
- ✅ Real Guardian scores
- ✅ Gas estimates
- ✅ Slippage calculations
- ✅ Net benefit after costs
- ✅ Risk classifications
- ✅ Execution time estimates

---

## Clean Up (Optional)

To remove test data later:

```sql
DELETE FROM harvest_lots WHERE token IN ('ETH', 'MATIC', 'LINK', 'UNI');
DELETE FROM harvest_user_wallets WHERE wallet_name IN ('Main Wallet', 'Trading Wallet');
```

---

## Summary

✅ **Modal issue** - Fixed! Works in both Demo and Live mode
✅ **Live mode** - Just needs test data seeded
✅ **Environment** - Already configured
✅ **Edge Functions** - Already deployed

You're literally 2 minutes away from a fully working Live mode!

**Next:** Run the seed script and click "Live" 🚀
