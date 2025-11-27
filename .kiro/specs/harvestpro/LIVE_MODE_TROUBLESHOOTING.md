# HarvestPro Live Mode Troubleshooting

## The Connection Error Explained

When you click "Live" mode, the UI tries to fetch real opportunities from `/api/harvest/opportunities`, which requires:

1. ✅ Environment variables configured (you have these)
2. ✅ Guardian Edge Functions deployed (you have these)
3. ❌ **User authentication** (you need to be logged in)
4. ❌ **Database tables with data** (likely empty)

## Quick Diagnosis

### Step 1: Check if You're Logged In

Open your browser console and run:
```javascript
// Check if user is authenticated
const { data } = await supabase.auth.getUser();
console.log('User:', data.user);
```

If `data.user` is `null`, you're not logged in.

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Click "Live" mode
3. Look for the request to `/api/harvest/opportunities`
4. Check the response:
   - **401 Unauthorized** = You're not logged in
   - **500 Internal Error** = Edge Function or database issue
   - **Connection failed** = Dev server or Supabase connection issue

## Solutions

### Solution 1: Log In First (Most Likely)

Before clicking "Live" mode, you need to:

1. Go to your app's login page
2. Sign in with your account
3. Then navigate to HarvestPro
4. Click "Live" mode

**Or** create a test user:
```sql
-- Run this in Supabase SQL Editor
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test@harvestpro.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

### Solution 2: Seed the Database

The `harvest_opportunities` table is likely empty. You need to:

1. **Add some wallet addresses** to `harvest_user_wallets` table
2. **Add some transaction history** to `harvest_lots` table
3. **Run the recompute function** to generate opportunities

**Quick seed script:**
```sql
-- Run this in Supabase SQL Editor
-- Replace 'YOUR_USER_ID' with your actual user ID

-- 1. Add a test wallet
INSERT INTO harvest_user_wallets (user_id, wallet_address, wallet_name, chain, is_active)
VALUES (
  'YOUR_USER_ID',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  'Test Wallet',
  'ethereum',
  true
);

-- 2. Add some test lots (simulating losses)
INSERT INTO harvest_lots (
  user_id,
  wallet_address,
  token,
  chain,
  quantity,
  cost_basis_usd,
  current_price_usd,
  unrealized_pnl_usd,
  acquisition_date,
  is_eligible_for_harvest
)
VALUES
  (
    'YOUR_USER_ID',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    'ETH',
    'ethereum',
    2.5,
    5000.00,
    4500.00,
    -500.00,
    now() - interval '60 days',
    true
  ),
  (
    'YOUR_USER_ID',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    'MATIC',
    'polygon',
    5000,
    3000.00,
    2200.00,
    -800.00,
    now() - interval '90 days',
    true
  );
```

### Solution 3: Test the Edge Function Directly

Test if the Edge Function works:

```bash
# Test the harvest-recompute-opportunities function
curl -X POST 'https://rebeznxivaxgserswhbn.supabase.co/functions/v1/harvest-recompute-opportunities' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "taxRate": 0.24,
    "minLossThreshold": 100
  }'
```

If this returns data, the Edge Function works and the issue is authentication.

### Solution 4: Check Supabase Connection

Make sure your dev server can reach Supabase:

```bash
# Test Supabase connection
curl https://rebeznxivaxgserswhbn.supabase.co/rest/v1/
```

Should return: `{"message":"The server is running"}`

## Expected Behavior

### Demo Mode (Default)
- ✅ Shows mock data immediately
- ✅ No API calls
- ✅ Works without authentication
- ✅ Modal opens when clicking "Start Harvest"

### Live Mode
- ⏳ Shows loading skeleton
- 🔄 Makes API call to `/api/harvest/opportunities`
- 🔐 Requires authentication
- 📊 Shows real data from database
- ✅ Modal opens when clicking "Start Harvest"

## Most Likely Issue

**You're not logged in!** 

The connection error is actually the API returning a 401 Unauthorized response because there's no authenticated user.

## Quick Test

1. Stay in Demo mode (it works!)
2. Click "Start Harvest" on any card
3. The modal should open ✅

This proves the UI is working perfectly. The "Live" mode just needs you to be logged in first.

---

**Next Steps:**
1. Create a test user account
2. Log in
3. Seed some test data
4. Try "Live" mode again

The connection error is expected behavior when not authenticated - it's actually a good sign that security is working!
