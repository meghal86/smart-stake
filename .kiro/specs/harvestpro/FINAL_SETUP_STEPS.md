# HarvestPro - Final Setup Steps (2 Minutes!)

**Status:** 🎉 Almost Done!  
**Time Required:** 2 minutes  
**Cost:** $0 (CoinGecko is now free!)

## What's Already Done ✅

1. ✅ **Supabase** - Configured
2. ✅ **CoinGecko** - FREE public API (no key needed!)
3. ✅ **CEX Encryption Key** - Generated for you
4. ✅ **Guardian Integration** - Uses your existing Guardian

## What You Need to Do (2 Steps!)

### Step 1: Add to `.env` File (1 minute)

Open your `.env` file and add these 2 lines:

```bash
# HarvestPro Required Variables (Only 2!)
CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419
GUARDIAN_API_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

That's it! Just 2 lines.

### Step 2: Set Supabase Secrets (1 minute)

Run these commands in your terminal:

```bash
# Set the 2 required secrets
supabase secrets set CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419
supabase secrets set GUARDIAN_API_KEY=$(echo $SUPABASE_SERVICE_ROLE_KEY)

# Verify they're set
supabase secrets list
```

## Done! 🎉

That's it! HarvestPro is now configured.

### Test It

```bash
# Restart dev server
npm run dev

# Open HarvestPro
open http://localhost:3003/harvest

# Toggle demo mode OFF
# Verify everything works
```

## Optional: Add Fallback Services

If you want extra reliability, you can optionally add these (all have free tiers):

```bash
# Optional: CoinMarketCap fallback (free tier: 10k calls/month)
COINMARKETCAP_API_KEY=your_key_here

# Optional: Alchemy RPC provider (free tier available)
ALCHEMY_API_KEY=your_key_here

# Optional: 1inch DEX quotes (free tier available)
ONEINCH_API_KEY=your_key_here
```

But these are **not required** to get started!

## Summary

**Required:** 2 environment variables (2 minutes to configure)  
**Optional:** 3 additional services (for production reliability)  
**Cost:** $0/month  
**Savings:** $1,548-$5,988/year (CoinGecko is now free!)

---

**Next:** Test HarvestPro and deploy to production! 🚀

