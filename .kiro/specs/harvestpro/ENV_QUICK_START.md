# HarvestPro Environment Variables - Quick Start

**⏱️ Time Required:** 10-15 minutes  
**Status:** 6 variables need configuration

## 🚨 Critical Variables (Must Have)

### 1. CEX Encryption Key ✅ GENERATED

**Already generated for you:**
```bash
CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419
```

**Action Required:**
1. Add to `.env` file
2. Set in Supabase:
   ```bash
   supabase secrets set CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419
   ```

### 2. Guardian API Key ✅ USE EXISTING

**What it does:** Security scanning and risk scoring

**Good News:** You already have Guardian built! HarvestPro uses your existing Guardian Edge Function.

**Action Required:**
```bash
# Guardian API Key = Your Supabase Service Role Key
# Add to .env
GUARDIAN_API_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Or set in Supabase secrets (use same key)
supabase secrets set GUARDIAN_API_KEY=$(echo $SUPABASE_SERVICE_ROLE_KEY)
```

**Note:** HarvestPro calls your internal `guardian-scan` Edge Function, not an external API.

### 3. CoinGecko API Key ⚠️ NEEDS PRODUCTION KEY

**What it does:** Primary price oracle for token prices

**How to get:**
1. Go to https://www.coingecko.com/en/api/pricing
2. Sign up for API plan (free tier available)
3. Get API key from dashboard

**Action Required:**
```bash
# Update in .env (replace placeholder)
COINGECKO_API_KEY=your_real_coingecko_api_key

# Set in Supabase
supabase secrets set COINGECKO_API_KEY=your_real_coingecko_api_key
```

## 🔧 Recommended Variables (Improves Functionality)

### 4. CoinMarketCap API Key

**What it does:** Backup price oracle (fallback when CoinGecko fails)

**How to get:**
1. Go to https://coinmarketcap.com/api/
2. Sign up for free tier (10,000 calls/month)
3. Get API key

**Action Required:**
```bash
# Add to .env
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Set in Supabase
supabase secrets set COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### 5. Alchemy API Key

**What it does:** RPC provider for blockchain data, gas estimation

**How to get:**
1. Go to https://www.alchemy.com/
2. Sign up and create a new app
3. Get API key from dashboard

**Action Required:**
```bash
# Add to .env
ALCHEMY_API_KEY=your_alchemy_api_key

# Set in Supabase
supabase secrets set ALCHEMY_API_KEY=your_alchemy_api_key
```

### 6. 1inch API Key

**What it does:** DEX quote simulation for slippage estimation

**How to get:**
1. Go to https://portal.1inch.dev/
2. Sign up for developer account
3. Create API key

**Action Required:**
```bash
# Add to .env
ONEINCH_API_KEY=your_oneinch_api_key

# Set in Supabase
supabase secrets set ONEINCH_API_KEY=your_oneinch_api_key
```

## 📝 Step-by-Step Setup

### Step 1: Add to Local `.env` File

Open `.env` and add these lines:

```bash
# HarvestPro Required Variables
CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419
GUARDIAN_API_KEY=your_guardian_api_key_here
COINGECKO_API_KEY=your_real_coingecko_api_key_here

# HarvestPro Recommended Variables
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
ONEINCH_API_KEY=your_oneinch_api_key_here
```

### Step 2: Set Supabase Secrets (for Edge Functions)

Run these commands:

```bash
# Required
supabase secrets set CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419
supabase secrets set GUARDIAN_API_KEY=your_guardian_api_key_here
supabase secrets set COINGECKO_API_KEY=your_real_coingecko_api_key_here

# Recommended
supabase secrets set COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
supabase secrets set ALCHEMY_API_KEY=your_alchemy_api_key_here
supabase secrets set ONEINCH_API_KEY=your_oneinch_api_key_here

# Verify all secrets are set
supabase secrets list
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test HarvestPro

1. Open http://localhost:3003/harvest
2. Toggle demo mode OFF
3. Check browser console for errors
4. Verify API calls work in Network tab

## ✅ Verification Checklist

Run the setup script to check your configuration:

```bash
./scripts/setup-harvestpro-env.sh
```

You should see:
- ✅ All required variables configured
- ✅ Supabase secrets set
- ✅ No console errors in browser
- ✅ API calls returning data

## 🚨 Troubleshooting

### "Missing GUARDIAN_API_KEY" Error

**Solution:** Contact AlphaWhale team for Guardian API access. This is an internal service.

### "Price oracle unavailable" Error

**Solution:** Verify CoinGecko API key is valid:
```bash
curl "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&x_cg_demo_api_key=YOUR_KEY"
```

### "RPC provider unavailable" Error

**Solution:** Add Alchemy API key (or Infura as fallback).

## 📚 Full Documentation

For complete details, see:
- **Full Guide:** `.kiro/specs/harvestpro/ENVIRONMENT_SETUP_GUIDE.md`
- **Architecture:** `.kiro/specs/harvestpro/design.md`
- **Implementation Status:** `.kiro/specs/harvestpro/FINAL_IMPLEMENTATION_STATUS.md`

## 🎯 Next Steps After Setup

1. ✅ Environment variables configured (this step)
2. ⏭️ Run database migrations: `supabase db push`
3. ⏭️ Test HarvestPro end-to-end
4. ⏭️ Deploy to production 🚀

---

**Time to Complete:** 10-15 minutes  
**Difficulty:** Easy (mostly copy-paste)  
**Blockers:** Guardian API key (contact team)
