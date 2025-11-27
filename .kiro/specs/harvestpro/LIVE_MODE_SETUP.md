# Get HarvestPro Live Mode Working (2 Minutes)

## Quick Setup

### Step 1: Make Sure You're Logged In

1. Go to your app (http://localhost:3003)
2. Sign up or log in with any account
3. Remember your email/password

### Step 2: Seed Test Data

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `rebeznxivaxgserswhbn`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/seeds/harvestpro_test_data.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

You should see:
```
✅ Test data seeded successfully!
✅ Total lots created: 4
✅ Total potential loss: $10,350
✅ Estimated tax benefit (24%): $2,484
```

### Step 3: Test Live Mode

1. Go back to your app
2. Navigate to HarvestPro: http://localhost:3003/harvest
3. Make sure you're logged in (check top right corner)
4. Click the **"Live"** button in the header
5. You should see:
   - Loading skeleton appears
   - Then 4 harvest opportunities load!
   - ETH: $4,500 loss → $1,080 net benefit
   - MATIC: $2,800 loss → $672 net benefit
   - LINK: $1,850 loss → $444 net benefit
   - UNI: $1,200 loss → $288 net benefit

### Step 4: Test the Modal

1. Click **"Start Harvest"** on any opportunity card
2. The modal should open with full details ✅
3. Review the execution steps
4. Click **"Execute Harvest"** to test the flow

## Troubleshooting

### "Connection Error" Still Appears

**Check 1: Are you logged in?**
```javascript
// Open browser console and run:
const { data } = await supabase.auth.getUser();
console.log('User:', data.user);
```

If `data.user` is `null`, you need to log in first.

**Check 2: Did the seed script run successfully?**
```sql
-- Run this in Supabase SQL Editor:
SELECT count(*) FROM harvest_lots;
```

Should return at least 4 rows.

**Check 3: Check the Network tab**
1. Open DevTools → Network tab
2. Click "Live" mode
3. Look for `/api/harvest/opportunities`
4. Check the response:
   - **200 OK** = Working! ✅
   - **401 Unauthorized** = Not logged in
   - **500 Error** = Check console logs

### "No Opportunities Detected" Appears

This means:
- ✅ You're logged in
- ✅ API is working
- ❌ No data in database for your user

**Solution:** Make sure you ran the seed script while logged in as the same user.

### Edge Function Not Found

If you get "Edge Function not found" error:

```bash
# Deploy the Edge Functions
supabase functions deploy harvest-recompute-opportunities
supabase functions deploy guardian-scan-v2
supabase functions deploy guardian-healthz
```

## What the Seed Script Creates

The script creates:
- **2 test wallets** (Ethereum + Polygon)
- **4 positions with losses:**
  - ETH: -$4,500 (60 days old)
  - MATIC: -$2,800 (90 days old)
  - LINK: -$1,850 (45 days old)
  - UNI: -$1,200 (120 days old)
- **User tax settings** (24% tax rate)

All positions are eligible for tax-loss harvesting!

## Expected Behavior

### Demo Mode (Default)
- Shows 3 mock opportunities
- No API calls
- Works without login
- Modal opens perfectly ✅

### Live Mode (After Setup)
- Shows 4 real opportunities from database
- Makes API call to `/api/harvest/opportunities`
- Requires login
- Modal opens perfectly ✅
- Data persists across refreshes

## Verify It's Working

You'll know Live mode is working when:

1. ✅ Loading skeleton appears briefly
2. ✅ 4 opportunity cards load (not 3 mock ones)
3. ✅ Different token names (ETH, MATIC, LINK, UNI)
4. ✅ Different loss amounts than demo mode
5. ✅ "Last updated" timestamp shows current time
6. ✅ Modal opens when clicking "Start Harvest"

## Clean Up Test Data (Optional)

To remove test data later:

```sql
-- Run in Supabase SQL Editor
DELETE FROM harvest_lots WHERE token IN ('ETH', 'MATIC', 'LINK', 'UNI');
DELETE FROM harvest_user_wallets WHERE wallet_name IN ('Main Wallet', 'Trading Wallet');
```

---

**That's it!** Live mode should now work perfectly. The modal issue is already fixed, so everything should work smoothly.
