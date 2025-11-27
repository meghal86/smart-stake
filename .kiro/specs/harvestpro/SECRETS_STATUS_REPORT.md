# HarvestPro Supabase Secrets Status Report

**Date:** 2025-01-26  
**Status:** Checking Configuration

## Current Supabase Secrets

### ✅ Already Configured (HarvestPro Compatible)

1. ✅ **SUPABASE_URL** - Configured
2. ✅ **SUPABASE_SERVICE_ROLE_KEY** - Configured
3. ✅ **SUPABASE_ANON_KEY** - Configured
4. ✅ **ALCHEMY_API_KEY** - Configured (RPC provider)
5. ✅ **QUICKNODE_API_KEY** - Configured (RPC provider)
6. ✅ **QUICKNODE_ETH_URL** - Configured
7. ✅ **QUICKNODE_BTC_URL** - Configured
8. ✅ **ETHERSCAN_API_KEY** - Configured

### ❌ Missing for HarvestPro

1. ❌ **GUARDIAN_API_KEY** - Not set (use SUPABASE_SERVICE_ROLE_KEY)
2. ❌ **CEX_ENCRYPTION_KEY** - Not set (generated: `9141f796...`)
3. ❌ **COINGECKO_API_KEY** - Not set (need to get)
4. ❌ **COINMARKETCAP_API_KEY** - Not set (but you have CMC_API_KEY!)

### ⚠️ Potential Match

- **CMC_API_KEY** exists - This might be your CoinMarketCap key!
  - HarvestPro expects: `COINMARKETCAP_API_KEY`
  - You have: `CMC_API_KEY`
  - **Action:** Either rename or set both

## What You Need to Do

### 1. Set Guardian API Key (Use Existing Key)

```bash
# Guardian API Key = Your Supabase Service Role Key
supabase secrets set GUARDIAN_API_KEY=$(supabase secrets get SUPABASE_SERVICE_ROLE_KEY)
```

### 2. Set CEX Encryption Key (Pre-Generated)

```bash
supabase secrets set CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419
```

### 3. Handle CoinMarketCap Key

**Option A: Rename existing CMC_API_KEY**
```bash
# Get the value of CMC_API_KEY
supabase secrets get CMC_API_KEY

# Set it as COINMARKETCAP_API_KEY
supabase secrets set COINMARKETCAP_API_KEY=$(supabase secrets get CMC_API_KEY)
```

**Option B: Set new key**
```bash
supabase secrets set COINMARKETCAP_API_KEY=your_coinmarketcap_key
```

### 4. Set CoinGecko API Key (Required)

```bash
supabase secrets set COINGECKO_API_KEY=your_coingecko_api_key
```

## Quick Setup Commands

Run these commands in your terminal:

```bash
# 1. Set Guardian API Key (reuse service role key)
supabase secrets set GUARDIAN_API_KEY=$(supabase secrets get SUPABASE_SERVICE_ROLE_KEY)

# 2. Set CEX Encryption Key
supabase secrets set CEX_ENCRYPTION_KEY=9141f796f32f7b16d4b9239f8cb1c3574c9f39ade8f42d02862f3cd70f16e419

# 3. Set CoinMarketCap Key (reuse existing CMC_API_KEY)
supabase secrets set COINMARKETCAP_API_KEY=$(supabase secrets get CMC_API_KEY)

# 4. Set CoinGecko Key (you need to get this)
supabase secrets set COINGECKO_API_KEY=your_coingecko_api_key_here

# 5. Verify all secrets
supabase secrets list
```

## Summary

**Already Have (8/12):**
- ✅ Supabase keys (URL, Service Role, Anon)
- ✅ RPC providers (Alchemy, QuickNode)
- ✅ Etherscan API
- ✅ CMC_API_KEY (can reuse for COINMARKETCAP_API_KEY)

**Need to Set (4/12):**
1. GUARDIAN_API_KEY - Just copy SUPABASE_SERVICE_ROLE_KEY
2. CEX_ENCRYPTION_KEY - Use pre-generated key
3. COINMARKETCAP_API_KEY - Copy from CMC_API_KEY
4. COINGECKO_API_KEY - Need to get from coingecko.com

**Time Required:** 2-3 minutes (only need to get CoinGecko key)

## Next Steps

1. Get CoinGecko API key: https://www.coingecko.com/en/api/pricing
2. Run the 4 commands above
3. Verify with `supabase secrets list`
4. Test HarvestPro!

---

**Status:** You're 67% done! Only 4 secrets left to set, and 3 of them are quick copies! 🎉
