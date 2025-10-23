# Guardian Quick Start 🚀

Your Guardian implementation is **ready**, but the database and Edge Functions need to be set up. Follow these steps:

## ⚡ Quick Setup (5 minutes)

### Step 1: Check Environment Variables

Make sure your `.env.local` has the Supabase URL:

```bash
# Check if VITE_SUPABASE_URL is set
grep VITE_SUPABASE_URL .env.local
```

If missing, add it:
```bash
VITE_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Run Database Migration

The `guardian_scans` table doesn't exist yet. Run the migration:

```bash
# Option A: Using Supabase CLI (recommended)
supabase db push

# Option B: Manually via Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/20251022000001_guardian_tables.sql
```

### Step 3: Deploy Edge Functions

```bash
# Deploy the guardian-scan function
supabase functions deploy guardian-scan

# Optional: Deploy revoke and healthz functions
supabase functions deploy guardian-revoke
supabase functions deploy guardian-healthz
```

### Step 4: Set Function Environment Variables

```bash
# Set secrets for the Edge Functions
supabase secrets set ALCHEMY_API_KEY=your-alchemy-key
supabase secrets set ETHERSCAN_API_KEY=your-etherscan-key
```

### Step 5: Test

```bash
# Restart your dev server
npm run dev

# Navigate to http://localhost:8080/guardian
# Click "Connect Wallet" and you should see the scan working!
```

## 🔧 If You Don't Have Supabase CLI

### Manual Database Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/20251022000001_guardian_tables.sql`
5. Click **Run**

### Manual Edge Function Deployment

If you can't deploy Edge Functions yet, the Guardian will work with **mock data**:

The existing `guardianService.ts` has a fallback that returns mock data when the API fails. So you can:

1. Test the UI with mock data
2. Deploy functions later when ready

## 🎯 Quick Test Without Functions

If you want to see the UI working immediately with mock data:

1. The service already has `FALLBACK_SCAN` data built-in
2. Just navigate to `/guardian` in your browser
3. Click "Connect Wallet" (uses mock wallet)
4. You'll see the mock scan data with Trust Score 87

## 🐛 Troubleshooting

### Error: `guardian_scans` table not found (404)

**Fix:** Run the database migration (Step 2 above)

### Error: Edge Function not deployed (404 on function call)

**Fix:** The service will fall back to mock data. Deploy functions when ready (Step 3)

### Error: VITE_SUPABASE_URL not configured

**Fix:** Add to `.env.local`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
```

### Error: CORS issues with Edge Functions

**Fix:** Edge Functions include CORS headers. Make sure you're calling from `localhost:8080` or your production domain.

## 📝 Current Status

✅ **Frontend:** All UI components working
✅ **Service:** Updated to call Supabase Edge Functions
✅ **Database Schema:** Ready to deploy
✅ **Edge Functions:** Ready to deploy
⏳ **Migration:** Needs to be run
⏳ **Functions:** Need to be deployed

## 🎨 What You'll See

Once set up, navigate to `/guardian` and you'll see:

1. **Onboarding Screen** (if wallet not connected)
   - Hero with "Connect Wallet" button
   - Feature cards explaining Guardian

2. **Scan Results** (after connecting)
   - Trust Score gauge (0-100)
   - Letter grade (A-F)
   - Info tiles (Flags, Last scan, Chains)
   - Action buttons (Rescan, Fix Risks)

3. **Active Risks Section**
   - Mixer Exposure card
   - Contract Risks card
   - Unlimited Approvals card
   - Address Reputation card

4. **Revoke Modal** (click "Fix Risky Approvals")
   - List of risky approvals
   - Checkbox selection
   - Gas estimation
   - Revoke button

## 🚀 Production Deployment

When ready for production:

1. **Deploy Edge Functions** with production secrets
2. **Run migrations** on production database
3. **Set environment variables** in Vercel/production
4. **Test with real wallet** (integrate wagmi/RainbowKit)
5. **Monitor with health check**: `/functions/v1/guardian-healthz`

## 💡 Next Steps

1. ✅ Service now calls correct Supabase Edge Function
2. ⏳ Run database migration
3. ⏳ Deploy Edge Functions
4. 🎉 Test Guardian feature!

---

**Need Help?**
- Check console for detailed error messages
- Review `GUARDIAN_README.md` for full documentation
- Contact: dev@alphawhale.com

