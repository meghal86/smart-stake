sz# Task 3 Manual Validation Guide: Yield/Staking Module

## Overview

This guide provides step-by-step instructions to manually validate that the Yield/Staking module (Task 3) is working correctly.

## Prerequisites

Before starting validation, ensure:
- ✅ Environment variables are configured (from Task 0)
- ✅ Database migrations have been applied
- ✅ Development server can start without errors

## Validation Checklist

### 1. ✅ Verify Files Were Created

Check that all required files exist:

```bash
# Sync service
ls -la src/lib/hunter/sync/defillama.ts

# API route
ls -la src/app/api/sync/yield/route.ts

# Database migration
ls -la supabase/migrations/20260128000000_hunter_yield_columns.sql

# Property tests
ls -la src/__tests__/properties/hunter-defillama-sync.property.test.ts
ls -la src/__tests__/properties/hunter-sync-authorization.property.test.ts

# Integration tests
ls -la src/__tests__/integration/hunter-yield-sync.integration.test.ts
```

**Expected:** All files should exist (no "No such file" errors)

---

### 2. ✅ Run All Tests

#### 2.1 Property Tests for DeFiLlama Sync

```bash
npm test -- src/__tests__/properties/hunter-defillama-sync.property.test.ts --run
```

**Expected Output:**
```
✓ src/__tests__/properties/hunter-defillama-sync.property.test.ts (7 tests)
  ✓ DeFiLlama Sync - Idempotence > transforming same pool multiple times produces identical opportunities
  ✓ DeFiLlama Sync - Idempotence > filtering same pool list multiple times produces identical results
  ✓ DeFiLlama Sync - Response Caching > filter operation is deterministic and cacheable
  ✓ DeFiLlama Sync - Response Caching > transformation is deterministic for caching
  ✓ DeFiLlama Sync - Filter Criteria > filtered pools always meet all criteria
  ✓ DeFiLlama Sync - Transformation Correctness > transformed opportunities have required fields
  ✓ DeFiLlama Sync - Transformation Correctness > chain normalization is consistent

Test Files  1 passed (1)
Tests  7 passed (7)
```

#### 2.2 Property Tests for Authorization

```bash
npm test -- src/__tests__/properties/hunter-sync-authorization.property.test.ts --run
```

**Expected Output:**
```
✓ src/__tests__/properties/hunter-sync-authorization.property.test.ts (7 tests)
  ✓ Sync Job Authorization > rejects requests without CRON_SECRET header
  ✓ Sync Job Authorization > rejects requests with invalid CRON_SECRET
  ✓ Sync Job Authorization > authorization check is deterministic
  ✓ Sync Job Authorization > empty or whitespace secrets are rejected
  ✓ Sync Job Authorization > case-sensitive secret comparison
  ✓ Sync Job Authorization > secret with leading/trailing whitespace is rejected
  ✓ Sync Job Authorization - Timing Safety > comparison time does not leak secret length

Test Files  1 passed (1)
Tests  7 passed (7)
```

#### 2.3 Integration Tests

```bash
npm test -- src/__tests__/integration/hunter-yield-sync.integration.test.ts --run
```

**Expected Output:**
```
✓ src/__tests__/integration/hunter-yield-sync.integration.test.ts (7 tests)
  ↓ Yield Sync Integration Tests > sync job fetches DeFiLlama data and upserts to database [skipped]
  ↓ Yield Sync Integration Tests > running sync twice does not create duplicates [skipped]
  ↓ Yield Sync Integration Tests > sync completes within 30 seconds for 100 protocols [skipped]
  ✓ Yield Sync Unit Tests > filterPools removes pools with apy <= 0
  ✓ Yield Sync Unit Tests > filterPools removes pools with tvlUsd <= 100000
  ✓ Yield Sync Unit Tests > filterPools removes pools with unsupported chains
  ✓ Yield Sync Unit Tests > transformToOpportunities creates valid opportunities

Test Files  1 passed (1)
Tests  7 passed (7)
```

**Note:** Integration tests skip if Supabase credentials aren't configured. Unit tests should pass.

---

### 3. ✅ Test DeFiLlama Sync Service Manually

#### 3.1 Test in Node.js REPL

Create a test script:

```bash
cat > test-defillama-sync.js << 'EOF'
import { syncYieldOpportunities } from './src/lib/hunter/sync/defillama.ts';

async function test() {
  console.log('Testing DeFiLlama sync...');
  
  try {
    const result = await syncYieldOpportunities();
    
    console.log('\n✅ Sync completed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.count > 0) {
      console.log(`\n✅ Synced ${result.count} opportunities`);
    } else {
      console.log('\n⚠️  No opportunities synced (check filters)');
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(err => console.log('  -', err));
    }
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Run the test
node test-defillama-sync.js
```

**Expected Output:**
```
Testing DeFiLlama sync...
[DeFiLlama] Fetching pools from https://yields.llama.fi/pools
[DeFiLlama] Fetched 5000+ pools
[DeFiLlama] Filtered 150 pools from 5000 total
[DeFiLlama] Upserted 150/150 opportunities

✅ Sync completed successfully!
Result: {
  "count": 150,
  "source": "defillama",
  "duration_ms": 2500
}

✅ Synced 150 opportunities
```

#### 3.2 Test Filter Logic

```bash
cat > test-filter-logic.js << 'EOF'
import { filterPools } from './src/lib/hunter/sync/defillama.ts';

const testPools = [
  // Should PASS (apy > 0, tvl > 100k, supported chain)
  { pool: '1', chain: 'Ethereum', project: 'Aave', symbol: 'USDC', tvlUsd: 1000000, apy: 5.5 },
  
  // Should FAIL (apy = 0)
  { pool: '2', chain: 'Ethereum', project: 'Test', symbol: 'ETH', tvlUsd: 1000000, apy: 0 },
  
  // Should FAIL (tvl too low)
  { pool: '3', chain: 'Ethereum', project: 'Test', symbol: 'DAI', tvlUsd: 50000, apy: 10 },
  
  // Should FAIL (unsupported chain)
  { pool: '4', chain: 'Solana', project: 'Test', symbol: 'SOL', tvlUsd: 1000000, apy: 8 },
];

const filtered = filterPools(testPools);

console.log('Input pools:', testPools.length);
console.log('Filtered pools:', filtered.length);
console.log('Expected: 1 pool (only Aave USDC should pass)');

if (filtered.length === 1 && filtered[0].pool === '1') {
  console.log('✅ Filter logic works correctly!');
} else {
  console.log('❌ Filter logic failed!');
  console.log('Filtered pools:', filtered);
}
EOF

node test-filter-logic.js
```

**Expected Output:**
```
[DeFiLlama] Filtered 1 pools from 4 total
Input pools: 4
Filtered pools: 1
Expected: 1 pool (only Aave USDC should pass)
✅ Filter logic works correctly!
```

---

### 4. ✅ Test API Route with CRON_SECRET

#### 4.1 Test Without CRON_SECRET (Should Fail)

```bash
curl -X POST http://localhost:3000/api/sync/yield \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Output:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid cron secret"
  }
}
HTTP Status: 401
```

#### 4.2 Test With Invalid CRON_SECRET (Should Fail)

```bash
curl -X POST http://localhost:3000/api/sync/yield \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: wrong-secret" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Output:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid cron secret"
  }
}
HTTP Status: 401
```

#### 4.3 Test With Valid CRON_SECRET (Should Succeed)

```bash
# Get your CRON_SECRET from .env
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)

curl -X POST http://localhost:3000/api/sync/yield \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Output:**
```json
{
  "count": 150,
  "source": "defillama",
  "duration_ms": 2500,
  "ts": "2026-01-28T15:30:00.000Z"
}
HTTP Status: 200
```

---

### 5. ✅ Verify Database Schema

#### 5.1 Check Yield Columns Were Added

```bash
# Connect to your Supabase database
# Replace with your actual connection string
psql $DATABASE_URL -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opportunities' 
  AND column_name IN ('apy', 'tvl_usd', 'underlying_assets', 'lockup_days')
ORDER BY column_name;
"
```

**Expected Output:**
```
    column_name     |   data_type   
--------------------+---------------
 apy                | numeric
 lockup_days        | integer
 tvl_usd            | numeric
 underlying_assets  | ARRAY
(4 rows)
```

#### 5.2 Check user_yield_positions Table Exists

```bash
psql $DATABASE_URL -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'user_yield_positions';
"
```

**Expected Output:**
```
      table_name       
-----------------------
 user_yield_positions
(1 row)
```

#### 5.3 Verify RLS Policies

```bash
psql $DATABASE_URL -c "
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'user_yield_positions';
"
```

**Expected Output:**
```
           policyname            
---------------------------------
 p_user_yield_positions_select
 p_user_yield_positions_insert
 p_user_yield_positions_update
 p_user_yield_positions_delete
(4 rows)
```

---

### 6. ✅ Verify Vercel Cron Configuration

```bash
cat vercel.json | grep -A 2 "sync/yield"
```

**Expected Output:**
```json
    {
      "path": "/api/sync/yield",
      "schedule": "0 */2 * * *"
    },
```

**Explanation:** This means the sync job runs every 2 hours.

---

### 7. ✅ Test End-to-End Flow (Manual)

#### 7.1 Start Development Server

```bash
npm run dev
```

#### 7.2 Trigger Sync Job

In another terminal:

```bash
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)

curl -X POST http://localhost:3000/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  | jq '.'
```

**Expected:** JSON response with count > 0

#### 7.3 Query Database for Synced Opportunities

```bash
psql $DATABASE_URL -c "
SELECT 
  slug, 
  title, 
  type, 
  chains, 
  apy, 
  tvl_usd, 
  source, 
  source_ref 
FROM opportunities 
WHERE source = 'defillama' 
LIMIT 5;
"
```

**Expected Output:**
```
           slug           |              title              |  type   |  chains   | apy  |  tvl_usd   |  source   |    source_ref    
--------------------------+---------------------------------+---------+-----------+------+------------+-----------+------------------
 aave-ethereum-usdc       | Aave USDC Staking              | staking | {ethereum}| 5.50 | 1000000.00 | defillama | aave-eth-usdc
 compound-base-eth        | Compound ETH Yield             | yield   | {base}    | 3.20 |  500000.00 | defillama | compound-base-eth
...
```

#### 7.4 Verify Deduplication (Run Sync Twice)

```bash
# First sync
curl -X POST http://localhost:3000/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  | jq '.count'

# Count opportunities
COUNT1=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM opportunities WHERE source = 'defillama';")

# Second sync (should update, not duplicate)
curl -X POST http://localhost:3000/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  | jq '.count'

# Count again
COUNT2=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM opportunities WHERE source = 'defillama';")

echo "Count after first sync: $COUNT1"
echo "Count after second sync: $COUNT2"

if [ "$COUNT1" -eq "$COUNT2" ]; then
  echo "✅ Deduplication works! No duplicates created."
else
  echo "❌ Deduplication failed! Duplicates were created."
fi
```

**Expected:** Both counts should be equal (no duplicates)

---

### 8. ✅ Performance Validation

#### 8.1 Measure Sync Duration

```bash
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)

time curl -X POST http://localhost:3000/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  -o /dev/null -s -w "Duration: %{time_total}s\n"
```

**Expected:** Duration < 30 seconds (per requirement 2.6)

#### 8.2 Check Response Caching

```bash
# First call (should fetch from DeFiLlama)
echo "First call (fetching from API):"
time curl -X POST http://localhost:3000/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  -o /dev/null -s -w "Duration: %{time_total}s\n"

# Second call within 30 minutes (should use cache)
echo -e "\nSecond call (should use cache):"
time curl -X POST http://localhost:3000/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  -o /dev/null -s -w "Duration: %{time_total}s\n"
```

**Expected:** Second call should be significantly faster (< 1 second)

---

## Validation Summary Checklist

Use this checklist to track your validation progress:

- [-] All files created successfully
- [ ] Property tests pass (14 tests total)
- [ ] Integration tests pass (unit tests at minimum)
- [ ] DeFiLlama sync service works manually
- [ ] Filter logic correctly filters pools
- [ ] API route rejects requests without CRON_SECRET (401)
- [ ] API route rejects requests with invalid CRON_SECRET (401)
- [ ] API route accepts requests with valid CRON_SECRET (200)
- [ ] Database columns added (apy, tvl_usd, underlying_assets, lockup_days)
- [ ] user_yield_positions table created
- [ ] RLS policies created (4 policies)
- [ ] Vercel cron configuration present
- [ ] End-to-end sync works (count > 0)
- [ ] Opportunities appear in database
- [ ] Deduplication works (no duplicates on second sync)
- [ ] Sync completes within 30 seconds
- [ ] Response caching works (second call faster)

---

## Troubleshooting

### Issue: Tests fail with "supabaseKey is required"

**Solution:** Set Supabase credentials in `.env`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: API route returns 500 "CRON_SECRET not configured"

**Solution:** Add CRON_SECRET to `.env`:
```bash
CRON_SECRET=$(openssl rand -base64 32)
echo "CRON_SECRET=$CRON_SECRET" >> .env
```

### Issue: Sync returns count: 0

**Possible causes:**
1. DeFiLlama API is down (check https://yields.llama.fi/pools)
2. All pools filtered out (check filter criteria)
3. Network issues (check internet connection)

**Debug:**
```bash
# Check DeFiLlama API directly
curl https://yields.llama.fi/pools | jq '.data | length'
```

### Issue: Database migration not applied

**Solution:** Apply migration manually:
```bash
psql $DATABASE_URL < supabase/migrations/20260128000000_hunter_yield_columns.sql
```

---

## Success Criteria

Task 3 is successfully validated when:

✅ **All 21 tests pass** (14 property tests + 3 integration tests + 4 unit tests)  
✅ **API route enforces CRON_SECRET** (401 without valid secret)  
✅ **Sync job fetches real data** (count > 0 from DeFiLlama)  
✅ **Database schema updated** (4 new columns + 1 new table)  
✅ **Deduplication works** (no duplicates on repeated sync)  
✅ **Performance targets met** (< 30 seconds for sync)  
✅ **Caching works** (30-minute TTL on DeFiLlama responses)  

---

## Next Steps

After validating Task 3, you can proceed to:

- **Task 4:** Module 2 - Airdrops (Admin-seeded)
- **Task 5:** Module 3 - Quests (Admin-seeded)
- **Task 6:** Module 4 - Points/Loyalty (Admin-seeded)

Or test the complete Hunter feed with yield opportunities:
```bash
# Navigate to Hunter page
open http://localhost:3000/hunter

# Opportunities should now include yield/staking from DeFiLlama
```
