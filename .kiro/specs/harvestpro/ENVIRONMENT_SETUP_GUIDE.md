# HarvestPro Environment Variables Setup Guide

**Status:** Required for Production Deployment  
**Last Updated:** 2025-01-26

## Overview

This guide walks you through setting up all required environment variables for HarvestPro. Variables are organized by version (v1 Core, v2 Institutional, v3 Enterprise).

## Quick Start (Minimum Required for v1)

To get HarvestPro working, you need these **5 essential variables**:

1. ✅ **SUPABASE_URL** - Already configured
2. ✅ **SUPABASE_SERVICE_ROLE_KEY** - Already configured  
3. ⚠️ **COINGECKO_API_KEY** - Partially configured (need production key)
4. ❌ **GUARDIAN_API_KEY** - Not configured
5. ❌ **CEX_ENCRYPTION_KEY** - Not configured

## Environment Variable Checklist

### ✅ Already Configured

These are already set in your `.env` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
COINGECKO_API_KEY=your_coingecko_api_key  # Need production key
```

### ❌ Required for v1 Core (Not Yet Configured)

#### 1. Guardian API Key ✅ USE EXISTING

**Purpose:** Security scanning and risk scoring for tokens and transactions

**Good News:** You already have Guardian built into your app! HarvestPro will automatically use your existing Guardian Edge Function (`guardian-scan` and `guardian-scan-v2`).

**How to configure:**
The "Guardian API Key" is simply your Supabase Service Role Key. HarvestPro calls your internal Guardian Edge Function at `${SUPABASE_URL}/functions/v1/guardian-scan`.

**Add to `.env`:**
```bash
# Use your existing Supabase Service Role Key
GUARDIAN_API_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

**Add to Supabase Secrets:**
```bash
# Set Guardian API Key to your service role key
supabase secrets set GUARDIAN_API_KEY=$(echo $SUPABASE_SERVICE_ROLE_KEY)
```

**Note:** This is NOT an external API - it's your own Guardian feature that you've already built!

#### 2. CEX Encryption Key

**Purpose:** Encrypt CEX API credentials (Binance, Coinbase, etc.) in database

**How to generate:**
```bash
# Generate a secure 32-byte hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to `.env`:**
```bash
CEX_ENCRYPTION_KEY=a1b2c3d4e5f6...  # Your generated 32-byte hex key
```

**Add to Supabase Secrets:**
```bash
supabase secrets set CEX_ENCRYPTION_KEY=your_generated_key_here
```

#### 3. CoinMarketCap API Key (Fallback)

**Purpose:** Backup price oracle when CoinGecko is unavailable

**How to get it:**
1. Go to https://coinmarketcap.com/api/
2. Sign up for free tier (10,000 calls/month)
3. Get your API key from dashboard

**Add to `.env`:**
```bash
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
```

**Add to Supabase Secrets:**
```bash
supabase secrets set COINMARKETCAP_API_KEY=your_key_here
```

### 🔧 Recommended for v1 (Optional but Improves Functionality)

#### 4. RPC Provider Keys

**Purpose:** Blockchain data fetching, gas estimation, transaction broadcasting

**Alchemy (Recommended):**
1. Go to https://www.alchemy.com/
2. Sign up and create a new app
3. Get API key from dashboard

```bash
ALCHEMY_API_KEY=your_alchemy_api_key_here
```

**Infura (Fallback):**
1. Go to https://infura.io/
2. Sign up and create a new project
3. Get API key from dashboard

```bash
INFURA_API_KEY=your_infura_api_key_here
```

**QuickNode (Optional):**
1. Go to https://www.quicknode.com/
2. Sign up and create endpoint
3. Get API key

```bash
QUICKNODE_API_KEY=your_quicknode_api_key_here
```

**Add to Supabase Secrets:**
```bash
supabase secrets set ALCHEMY_API_KEY=your_key_here
supabase secrets set INFURA_API_KEY=your_key_here
supabase secrets set QUICKNODE_API_KEY=your_key_here
```

#### 5. 1inch API Key

**Purpose:** DEX quote simulation for slippage estimation

**How to get it:**
1. Go to https://portal.1inch.dev/
2. Sign up for developer account
3. Create API key

**Add to `.env`:**
```bash
ONEINCH_API_KEY=your_oneinch_api_key_here
```

**Add to Supabase Secrets:**
```bash
supabase secrets set ONEINCH_API_KEY=your_key_here
```

### 🏢 v2 Institutional Features (Optional)

Only needed if you're implementing v2 institutional features (Requirements 21-25).

#### Private RPC / MEV Protection

**Flashbots:**
```bash
FLASHBOTS_API_KEY=your_flashbots_api_key
```

**Eden Network:**
```bash
EDEN_API_KEY=your_eden_api_key
```

**bloXroute:**
```bash
BLOXROUTE_API_KEY=your_bloxroute_api_key
```

### 🏦 v3 Enterprise Features (Optional)

Only needed if you're implementing v3 enterprise features (Requirements 26-29).

#### Custody Providers

**Fireblocks:**
```bash
FIREBLOCKS_API_KEY=your_fireblocks_api_key
FIREBLOCKS_API_SECRET=your_fireblocks_api_secret
```

**Copper:**
```bash
COPPER_API_KEY=your_copper_api_key
COPPER_API_SECRET=your_copper_api_secret
```

#### Sanctions Screening / KYT

**TRM Labs:**
```bash
TRM_LABS_API_KEY=your_trm_labs_api_key
```

**Chainalysis:**
```bash
CHAINALYSIS_API_KEY=your_chainalysis_api_key
```

## Setup Instructions

### Step 1: Update Local `.env` File

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Add the required variables to your `.env` file:
   ```bash
   # Add these to your .env file
   GUARDIAN_API_KEY=your_guardian_api_key_here
   CEX_ENCRYPTION_KEY=your_generated_32_byte_hex_key
   COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
   ALCHEMY_API_KEY=your_alchemy_api_key_here
   ONEINCH_API_KEY=your_oneinch_api_key_here
   ```

### Step 2: Set Supabase Secrets (Edge Functions)

Edge Functions need access to these variables via Supabase Secrets:

```bash
# Required for v1
supabase secrets set GUARDIAN_API_KEY=your_guardian_api_key_here
supabase secrets set CEX_ENCRYPTION_KEY=your_generated_key_here
supabase secrets set COINGECKO_API_KEY=your_coingecko_api_key_here
supabase secrets set COINMARKETCAP_API_KEY=your_coinmarketcap_key_here

# Recommended for v1
supabase secrets set ALCHEMY_API_KEY=your_alchemy_key_here
supabase secrets set INFURA_API_KEY=your_infura_key_here
supabase secrets set ONEINCH_API_KEY=your_oneinch_key_here

# Verify secrets are set
supabase secrets list
```

### Step 3: Restart Development Server

After adding environment variables:

```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

### Step 4: Verify Configuration

Test that HarvestPro can access all required services:

```bash
# Test Edge Functions can access secrets
supabase functions invoke harvest-recompute-opportunities --data '{"userId":"test"}'

# Check logs for any missing environment variable errors
supabase functions logs harvest-recompute-opportunities
```

## Environment Variable Reference

### Where Each Variable is Used

| Variable | Used In | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | Edge Functions | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Database admin access |
| `COINGECKO_API_KEY` | `price-oracle.ts` | Primary price data |
| `COINMARKETCAP_API_KEY` | `price-oracle.ts` | Fallback price data |
| `GUARDIAN_API_KEY` | `guardian-adapter.ts` | Security scanning |
| `CEX_ENCRYPTION_KEY` | `cex-integration.ts` | Encrypt CEX credentials |
| `ALCHEMY_API_KEY` | `multi-chain-engine.ts` | RPC provider |
| `INFURA_API_KEY` | `multi-chain-engine.ts` | RPC fallback |
| `QUICKNODE_API_KEY` | `multi-chain-engine.ts` | RPC fallback |
| `ONEINCH_API_KEY` | `slippage-estimation.ts` | DEX quotes |
| `RPC_URL_*` | `gas-estimation.ts`, `token-tradability.ts` | Custom RPC endpoints |

## Troubleshooting

### Error: "Missing GUARDIAN_API_KEY"

**Solution:** Add `GUARDIAN_API_KEY` to Supabase secrets:
```bash
supabase secrets set GUARDIAN_API_KEY=your_key_here
```

### Error: "Missing CEX_ENCRYPTION_KEY"

**Solution:** Generate and add encryption key:
```bash
# Generate key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to Supabase secrets
supabase secrets set CEX_ENCRYPTION_KEY=your_generated_key
```

### Error: "Price oracle unavailable"

**Solution:** Verify CoinGecko and CoinMarketCap API keys:
```bash
# Test CoinGecko API
curl "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&x_cg_demo_api_key=YOUR_KEY"

# Add to Supabase secrets
supabase secrets set COINGECKO_API_KEY=your_key_here
supabase secrets set COINMARKETCAP_API_KEY=your_key_here
```

### Error: "RPC provider unavailable"

**Solution:** Add at least one RPC provider key:
```bash
supabase secrets set ALCHEMY_API_KEY=your_key_here
```

## Security Best Practices

### ✅ DO:
- Use Supabase Secrets for all sensitive keys in Edge Functions
- Use `.env` file for local development (never commit to git)
- Rotate API keys regularly
- Use different keys for development and production
- Monitor API usage and rate limits

### ❌ DON'T:
- Commit `.env` file to git (it's in `.gitignore`)
- Share API keys in Slack, email, or documentation
- Use production keys in development
- Store keys in frontend code (use Edge Functions)
- Use weak encryption keys

## Production Deployment Checklist

Before deploying to production:

- [ ] All required v1 environment variables are set in Supabase Secrets
- [ ] Production API keys are different from development keys
- [ ] API keys have appropriate rate limits configured
- [ ] CEX encryption key is securely stored and backed up
- [ ] Guardian API access is confirmed and working
- [ ] Price oracle fallback is configured (CoinMarketCap)
- [ ] RPC providers have sufficient rate limits for expected traffic
- [ ] All secrets are verified with `supabase secrets list`
- [ ] Edge Functions are deployed and tested
- [ ] Environment variables are documented in team wiki

## Next Steps

After setting up environment variables:

1. ✅ **Run Database Migrations** (2 min)
   ```bash
   supabase db push
   ```

2. ✅ **Test HarvestPro** (5 min)
   - Start dev server
   - Open HarvestPro page
   - Toggle demo mode OFF
   - Verify API calls work
   - Check for any console errors

3. 🚀 **Deploy to Production**
   - Verify all production secrets are set
   - Deploy Edge Functions
   - Test end-to-end flow
   - Monitor logs for errors

## Support

If you encounter issues:

1. Check Edge Function logs: `supabase functions logs harvest-recompute-opportunities`
2. Verify secrets are set: `supabase secrets list`
3. Check browser console for errors
4. Review this guide for missing variables
5. Contact AlphaWhale team for Guardian API access

---

**Status:** Environment variables setup is the final step before production deployment! 🚀
