# HarvestPro Live Mode - Proper Fix

## Problem Identified

The connection error occurs because:
1. The Edge Function `harvest-recompute-opportunities` expects data in `harvest_transactions` table
2. We only seeded `harvest_lots` and `harvest_opportunities` tables
3. When you click "Live", the API calls the Edge Function, which finds no transactions and returns empty results
4. The UI shows a connection error

## Proper Solution

Seed the `harvest_transactions` table with realistic transaction history so the Edge Function can:
1. Calculate FIFO lots from transaction history
2. Detect loss opportunities
3. Calculate net benefits
4. Return properly computed opportunities

## Step-by-Step Fix

### 1. Run the Transaction Seed File

```bash
# In Supabase SQL Editor, run this file:
supabase/seeds/07_harvest_transactions_seed.sql
```

This will:
- Create or use existing test user
- Insert 13 realistic transactions across 5 tokens (ETH, MATIC, LINK, BTC, SOL)
- Create transaction history that will generate 3 loss opportunities

### 2. Verify Data Was Seeded

```sql
-- Check transactions were inserted
SELECT token, COUNT(*) as tx_count, SUM(quantity) as total_qty
FROM harvest_transactions
GROUP BY token
ORDER BY token;

-- Expected output:
-- BTC:  1 transaction,  0.5 BTC
-- ETH:  3 transactions, 2.5 ETH remaining (after 1 sell)
-- LINK: 3 transactions, 150 LINK remaining (after 1 sell)
-- MATIC: 3 transactions, 5000 MATIC remaining (after 1 sell)
-- SOL:  1 transaction,  100 SOL
```

### 3. Test the Edge Function

You can test the Edge Function directly in Supabase:

```bash
# Get your user ID first
SELECT id FROM auth.users LIMIT 1;

# Then invoke the function (replace USER_ID)
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/harvest-recompute-opportunities' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "YOUR_USER_ID",
    "taxRate": 0.24,
    "minLossThreshold": 100
  }'
```

### 4. Test in UI

1. Open HarvestPro in your browser
2. Click the "Live" button in the header
3. You should see:
   - Loading state briefly
   - 3 opportunities appear (ETH, MATIC, LINK)
   - Summary card showing ~$5,126 total harvestable loss
   - No connection error

## Expected Results

### Opportunities Generated

**1. ETH Opportunity**
- Remaining: 2.5 ETH
- Cost Basis: ~$3,080/ETH
- Current Price: ~$2,400/ETH (from CoinGecko)
- Unrealized Loss: ~$1,700
- Risk Level: LOW
- Net Tax Benefit: ~$408 (after gas/slippage)

**2. MATIC Opportunity**
- Remaining: 5,000 MATIC
- Cost Basis: $1.10/MATIC
- Current Price: ~$0.56/MATIC (from CoinGecko)
- Unrealized Loss: ~$2,700
- Risk Level: MEDIUM
- Net Tax Benefit: ~$648 (after gas/slippage)

**3. LINK Opportunity**
- Remaining: 150 LINK
- Cost Basis: ~$17.17/LINK
- Current Price: ~$12.33/LINK (from CoinGecko)
- Unrealized Loss: ~$726
- Risk Level: HIGH
- Net Tax Benefit: ~$174 (after gas/slippage)

### Summary Card
- Total Harvestable Loss: ~$5,126
- Estimated Net Benefit: ~$1,230
- Eligible Tokens: 3
- Gas Efficiency Score: B

## Architecture Flow (Proper)

```
User clicks "Live" button
  ↓
isDemo = false
  ↓
useHarvestOpportunities hook enabled
  ↓
Fetches /api/harvest/opportunities
  ↓
API Route validates auth & params
  ↓
Calls harvest-recompute-opportunities Edge Function
  ↓
Edge Function:
  1. Reads harvest_transactions for user
  2. Calculates FIFO lots
  3. Gets current prices from CoinGecko
  4. Detects loss opportunities
  5. Estimates gas & slippage costs
  6. Calculates net benefits
  7. Classifies risk levels
  8. Returns computed opportunities
  ↓
API Route formats response
  ↓
UI displays opportunities
```

## Troubleshooting

### Still Getting Connection Error?

1. **Check if Edge Function is deployed:**
   ```bash
   supabase functions list
   ```
   Should show `harvest-recompute-opportunities`

2. **Check Edge Function logs:**
   ```bash
   supabase functions logs harvest-recompute-opportunities
   ```

3. **Verify user authentication:**
   - Make sure you're logged in
   - Check browser console for auth errors

4. **Check environment variables:**
   ```bash
   # In Supabase dashboard, verify these secrets are set:
   - COINGECKO_API_KEY (or use free tier)
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   ```

### No Opportunities Showing?

1. **Check if transactions were seeded:**
   ```sql
   SELECT COUNT(*) FROM harvest_transactions;
   ```
   Should return 13

2. **Check current prices:**
   The Edge Function fetches live prices from CoinGecko. If prices have changed significantly, the opportunities might be different.

3. **Check minLossThreshold:**
   Default is $100. SOL opportunity (~$100 loss) might not show if threshold is too high.

## Next Steps

Once this is working:
1. You can add more transaction history for testing
2. Test different tax rates and thresholds
3. Test the full harvest flow (modal → execution → success screen)
4. Test CSV export functionality

## Clean Up (Optional)

To start fresh:

```sql
-- Clear all HarvestPro data
DELETE FROM harvest_transactions;
DELETE FROM harvest_lots;
DELETE FROM harvest_opportunities;
DELETE FROM harvest_sessions;
DELETE FROM execution_steps;

-- Then re-run the seed file
```

## Summary

The proper fix seeds `harvest_transactions` with realistic buy/sell history, allowing the Edge Function to compute opportunities dynamically using the full FIFO engine, price oracle, and net benefit calculations. This is the correct architecture and will work in production.
