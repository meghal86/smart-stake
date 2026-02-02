# Browser Test Troubleshooting Guide

## Issue: "Failed to fetch" Errors

### Problem
You're seeing these errors in the browser test:
```
❌ Non-Personalized Performance Test failed: Failed to fetch
❌ Personalized Performance Test failed: Failed to fetch
❌ History Performance Test failed: Failed to fetch
```

### Root Cause
The development server is not running. The browser test needs the API endpoints to be available at `http://localhost:3000` (or your configured port).

### Solution

#### Step 1: Start the Development Server

Open a terminal and run:

```bash
npm run dev
```

Or if you're using a different package manager:

```bash
# Yarn
yarn dev

# Bun
bun dev

# pnpm
pnpm dev
```

#### Step 2: Wait for Server to Start

You should see output like:
```
> smart-stake@0.1.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.3s
```

#### Step 3: Refresh the Browser Test

Once the server is running:
1. Go back to the browser test tab
2. Click "Clear Results"
3. Click "Run All Tests" again

### Expected Results

With the server running, you should see:

**Phase 1: Non-Personalized Feed**
- ✅ Non-Personalized Endpoint
- ✅ Response Structure
- ✅ Type Filtering
- ✅ Non-Personalized Fields
- ✅ Airdrop-Specific Fields

**Phase 2: Personalized Feed** (if wallet provided)
- ✅ Personalized Endpoint
- ✅ Eligibility Preview
- ✅ Ranking

**Phase 3: History Endpoint** (if wallet provided)
- ✅ History Endpoint
- ✅ Status Categories
- ✅ Nested Opportunity

**Performance Tests**
- ✅ Non-Personalized Performance (< 2000ms)
- ✅ Personalized Performance (< 5000ms)
- ✅ History Performance (< 2000ms)

## Alternative: Use the Integration Tests

If you prefer not to use the browser test, you can run the integration tests instead:

```bash
# Run all airdrops integration tests
npm test -- src/__tests__/integration/hunter-airdrops-api.integration.test.ts --run

# Run personalized feed tests
npm test -- src/__tests__/integration/hunter-airdrops-personalized-api.integration.test.ts --run

# Run history endpoint tests
npm test -- src/__tests__/integration/hunter-airdrops-history-api.integration.test.ts --run
```

## Checking Server Status

To verify the server is running and the endpoints are accessible:

```bash
# Test non-personalized endpoint
curl http://localhost:3000/api/hunter/airdrops

# Test with wallet (replace with actual wallet)
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# Test history endpoint
curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

If these curl commands return JSON responses, the server is working correctly.

## Common Issues

### Port Already in Use

If you see:
```
Error: listen EADDRINUSE: address already in use :::3000
```

Either:
1. Kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. Or use a different port:
   ```bash
   PORT=3001 npm run dev
   ```
   Then update the browser test URL to `http://localhost:3001`

### Database Not Connected

If the endpoints return errors about database connection:
1. Check your `.env` file has correct Supabase credentials
2. Verify Supabase project is running
3. Check migrations are applied

### No Airdrops in Database

If tests pass but show "No airdrops to test":
1. Run the seed scripts:
   ```bash
   npm run seed:airdrops
   ```

2. Verify data was inserted:
   ```bash
   # Check opportunities table
   npx supabase db query "SELECT COUNT(*) FROM opportunities WHERE type='airdrop';"
   ```

## Next Steps

Once the server is running and tests pass:
1. ✅ Browser test complete
2. ⏸️ Move to Phase 5: Cache Testing
3. ⏸️ Complete remaining integration tests

## Quick Reference

**Start Server:**
```bash
npm run dev
```

**Run Browser Test:**
```bash
open test-airdrops-browser.html
```

**Run Integration Tests:**
```bash
npm test -- src/__tests__/integration/hunter-airdrops-*.integration.test.ts --run
```

**Seed Data:**
```bash
npm run seed:airdrops
```
