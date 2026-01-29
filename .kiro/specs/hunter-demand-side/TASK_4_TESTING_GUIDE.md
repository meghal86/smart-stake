# Task 4: Airdrops Module - Testing Guide

## Quick Start Testing Checklist

### Prerequisites
- [ ] Dev server running: `npm run dev`
- [ ] Database migration applied
- [ ] Environment variables configured (`.env` file)
- [ ] Admin seed data loaded

## 1. Unit Tests (Automated)

### Run All Airdrop Tests
```bash
npm test -- src/__tests__/unit/hunter-airdrop-eligibility.test.ts --run
```

**Expected Output:**
```
✓ 17 tests passed
```

**What's Tested:**
- Claim window logic (before/during/after)
- Snapshot date eligibility
- Galxe campaign classification
- DeFiLlama transformation
- Multi-source deduplication
- Chain mapping

## 2. Database Schema Verification

### Check Tables Exist
```bash
# Using Supabase CLI
npx supabase db inspect

# Or query directly
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%airdrop%';"
```

**Expected Tables:**
- `opportunities` (with airdrop columns)
- `user_airdrop_status`

### Verify Airdrop Columns
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opportunities' 
AND column_name IN ('snapshot_date', 'claim_start', 'claim_end', 'airdrop_category');
```

**Expected Output:**
```
snapshot_date     | timestamp with time zone
claim_start       | timestamp with time zone
claim_end         | timestamp with time zone
airdrop_category  | text
```

## 3. Admin Seed Script Testing

### Run Seed Script
```bash
npm run seed:airdrops
```

**Expected Output:**
```
🌱 Seeding airdrops...

✅ Seeded: LayerZero Airdrop
✅ Seeded: zkSync Era Airdrop
✅ Seeded: Scroll Airdrop Season 1
... (12 total)

✅ Seeded 12 airdrops
✅ Airdrop seeding complete
```

### Verify Seeded Data
```sql
SELECT 
  title, 
  protocol_name, 
  source, 
  snapshot_date, 
  claim_start, 
  claim_end 
FROM opportunities 
WHERE type = 'airdrop' AND source = 'admin'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** 12 airdrops with realistic data

## 4. Sync Job Testing

### Test Airdrop Sync Endpoint

#### Step 1: Get CRON_SECRET
```bash
echo $CRON_SECRET
# Or from .env file
grep CRON_SECRET .env
```

#### Step 2: Test Sync (Local)
```bash
curl -X POST http://localhost:3000/api/sync/airdrops \
  -H "x-cron-secret: YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "count": 45,
  "sources": ["galxe", "defillama", "admin"],
  "breakdown": {
    "galxe": 20,
    "defillama": 15,
    "admin": 12
  },
  "duration_ms": 3500
}
```

#### Step 3: Test Authorization (Should Fail)
```bash
curl -X POST http://localhost:3000/api/sync/airdrops \
  -H "x-cron-secret: wrong-secret"
```

**Expected Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid cron secret"
  }
}
```

### Verify Synced Data
```sql
-- Check airdrops from all sources
SELECT 
  source, 
  COUNT(*) as count 
FROM opportunities 
WHERE type = 'airdrop' 
GROUP BY source;
```

**Expected Output:**
```
source      | count
------------|------
admin       | 12
galxe       | 15-25
defillama   | 10-20
```

## 5. API Endpoint Testing

### Test Airdrops Feed (Non-Personalized)

```bash
curl http://localhost:3000/api/hunter/airdrops
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": "...",
      "title": "LayerZero Airdrop",
      "protocol": "LayerZero",
      "type": "airdrop",
      "chains": ["ethereum", "arbitrum"],
      "snapshot_date": "2025-01-15T00:00:00Z",
      "claim_start": "2025-02-01T00:00:00Z",
      "claim_end": "2025-05-01T00:00:00Z"
    }
  ],
  "cursor": null,
  "ts": "2025-01-28T..."
}
```

### Test Airdrops Feed (Personalized)

```bash
# Replace with a real wallet address
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": "...",
      "title": "LayerZero Airdrop",
      "eligibility_preview": {
        "status": "likely",
        "score": 0.9,
        "reasons": [
          "Active on required chains",
          "✓ Active before snapshot",
          "Meets wallet age requirement"
        ]
      },
      "ranking": {
        "overall": 0.85,
        "relevance": 0.9,
        "freshness": 0.7
      }
    }
  ],
  "cursor": null,
  "ts": "2025-01-28T..."
}
```

### Test Airdrop History

```bash
curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Expected Response:**
```json
{
  "items": [],
  "ts": "2025-01-28T..."
}
```
*(Empty initially, will populate as users claim airdrops)*

## 6. Integration Testing

### Test Complete Flow

Create a test file: `test-airdrops-flow.js`

```javascript
const BASE_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

async function testAirdropsFlow() {
  console.log('🧪 Testing Airdrops Module...\n');

  // Test 1: Sync airdrops
  console.log('1️⃣ Testing sync endpoint...');
  const syncResponse = await fetch(`${BASE_URL}/api/sync/airdrops`, {
    method: 'POST',
    headers: {
      'x-cron-secret': CRON_SECRET,
    },
  });
  const syncData = await syncResponse.json();
  console.log('✅ Sync result:', syncData);
  console.assert(syncData.count > 0, 'Should sync airdrops');

  // Test 2: Get airdrops feed
  console.log('\n2️⃣ Testing airdrops feed...');
  const feedResponse = await fetch(`${BASE_URL}/api/hunter/airdrops`);
  const feedData = await feedResponse.json();
  console.log(`✅ Found ${feedData.items.length} airdrops`);
  console.assert(feedData.items.length > 0, 'Should return airdrops');

  // Test 3: Get personalized feed
  console.log('\n3️⃣ Testing personalized feed...');
  const personalizedResponse = await fetch(
    `${BASE_URL}/api/hunter/airdrops?wallet=${TEST_WALLET}`
  );
  const personalizedData = await personalizedResponse.json();
  console.log(`✅ Personalized feed has ${personalizedData.items.length} items`);
  
  if (personalizedData.items.length > 0) {
    const firstItem = personalizedData.items[0];
    console.log('   Eligibility:', firstItem.eligibility_preview?.status);
    console.log('   Ranking:', firstItem.ranking?.overall);
    console.assert(
      firstItem.eligibility_preview,
      'Should have eligibility preview'
    );
    console.assert(firstItem.ranking, 'Should have ranking');
  }

  // Test 4: Get history
  console.log('\n4️⃣ Testing airdrop history...');
  const historyResponse = await fetch(
    `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`
  );
  const historyData = await historyResponse.json();
  console.log(`✅ History has ${historyData.items.length} items`);

  console.log('\n✅ All tests passed!');
}

testAirdropsFlow().catch(console.error);
```

**Run the test:**
```bash
node test-airdrops-flow.js
```

## 7. Browser Testing

### Create Test HTML File

Create `test-airdrops-browser.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Airdrops Module Test</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .test { margin: 20px 0; padding: 10px; border: 1px solid #ccc; }
    .success { background: #d4edda; }
    .error { background: #f8d7da; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Airdrops Module Test</h1>
  
  <div id="results"></div>

  <script>
    const BASE_URL = 'http://localhost:3000';
    const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const results = document.getElementById('results');

    async function runTest(name, testFn) {
      const div = document.createElement('div');
      div.className = 'test';
      div.innerHTML = `<h3>${name}</h3><p>Running...</p>`;
      results.appendChild(div);

      try {
        const result = await testFn();
        div.className = 'test success';
        div.innerHTML = `
          <h3>✅ ${name}</h3>
          <pre>${JSON.stringify(result, null, 2)}</pre>
        `;
      } catch (error) {
        div.className = 'test error';
        div.innerHTML = `
          <h3>❌ ${name}</h3>
          <p>${error.message}</p>
        `;
      }
    }

    async function testAirdropsFeed() {
      const response = await fetch(`${BASE_URL}/api/hunter/airdrops`);
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        throw new Error('No airdrops returned');
      }
      return {
        count: data.items.length,
        sample: data.items[0]
      };
    }

    async function testPersonalizedFeed() {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops?wallet=${TEST_WALLET}`
      );
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        throw new Error('No personalized airdrops returned');
      }
      const firstItem = data.items[0];
      if (!firstItem.eligibility_preview) {
        throw new Error('Missing eligibility preview');
      }
      if (!firstItem.ranking) {
        throw new Error('Missing ranking');
      }
      return {
        count: data.items.length,
        eligibility: firstItem.eligibility_preview.status,
        ranking: firstItem.ranking.overall
      };
    }

    async function testHistory() {
      const response = await fetch(
        `${BASE_URL}/api/hunter/airdrops/history?wallet=${TEST_WALLET}`
      );
      const data = await response.json();
      return {
        count: data.items.length
      };
    }

    // Run all tests
    (async () => {
      await runTest('Airdrops Feed', testAirdropsFeed);
      await runTest('Personalized Feed', testPersonalizedFeed);
      await runTest('Airdrop History', testHistory);
    })();
  </script>
</body>
</html>
```

**Open in browser:**
```bash
open test-airdrops-browser.html
```

## 8. Performance Testing

### Test Sync Performance
```bash
time curl -X POST http://localhost:3000/api/sync/airdrops \
  -H "x-cron-secret: $CRON_SECRET"
```

**Expected:** < 5 seconds

### Test API Performance
```bash
time curl http://localhost:3000/api/hunter/airdrops
```

**Expected:** < 200ms (non-personalized)

```bash
time curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Expected:** < 2 seconds (personalized)

## 9. Cache Testing

### Test Galxe Cache (10 minutes)
```bash
# First call (should fetch from API)
time curl -X POST http://localhost:3000/api/sync/airdrops \
  -H "x-cron-secret: $CRON_SECRET"

# Second call immediately (should use cache)
time curl -X POST http://localhost:3000/api/sync/airdrops \
  -H "x-cron-secret: $CRON_SECRET"
```

**Expected:** Second call should be much faster

### Test Eligibility Cache (24 hours)
```bash
# First call (computes eligibility)
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# Check cache in database
psql $DATABASE_URL -c "SELECT wallet_address, opportunity_id, eligibility_status, created_at FROM eligibility_cache LIMIT 5;"
```

## 10. Error Handling Testing

### Test Invalid CRON_SECRET
```bash
curl -X POST http://localhost:3000/api/sync/airdrops \
  -H "x-cron-secret: invalid"
```

**Expected:** 401 Unauthorized

### Test Missing Wallet Parameter
```bash
curl "http://localhost:3000/api/hunter/airdrops/history"
```

**Expected:** 400 Bad Request

### Test Invalid Wallet Address
```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=invalid"
```

**Expected:** Should handle gracefully (return non-personalized or error)

## 11. Snapshot Eligibility Testing

### Test Wallet Active Before Snapshot
```sql
-- Insert test airdrop with snapshot date
INSERT INTO opportunities (
  slug, title, protocol, protocol_name, type, chains,
  reward_min, reward_max, reward_currency, trust_score,
  source, source_ref, dedupe_key,
  snapshot_date, claim_start, claim_end,
  status, description, tags
) VALUES (
  'test-snapshot-airdrop',
  'Test Snapshot Airdrop',
  'TestProtocol',
  'TestProtocol',
  'airdrop',
  ARRAY['ethereum'],
  100, 1000, 'USD', 90,
  'admin', 'test-snapshot-1', 'admin:test-snapshot-1',
  '2024-01-01T00:00:00Z',
  '2025-02-01T00:00:00Z',
  '2025-05-01T00:00:00Z',
  'published',
  'Test airdrop with snapshot date',
  ARRAY['airdrop', 'test']
);
```

**Test with old wallet (should be eligible):**
```bash
curl "http://localhost:3000/api/hunter/airdrops?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

Look for: `"✓ Active before snapshot"` in reasons

## 12. Troubleshooting

### Issue: No airdrops returned
**Solution:**
```bash
# Check if seed script ran
npm run seed:airdrops

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM opportunities WHERE type = 'airdrop';"
```

### Issue: Sync fails with 401
**Solution:**
```bash
# Verify CRON_SECRET is set
echo $CRON_SECRET

# Check .env file
grep CRON_SECRET .env
```

### Issue: Personalization not working
**Solution:**
```bash
# Check if Alchemy keys are configured
echo $ALCHEMY_TRANSFERS_API_KEY
echo $ALCHEMY_ETH_RPC_URL

# Test wallet signals
curl "http://localhost:3000/api/hunter/opportunities?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### Issue: Galxe/DeFiLlama sync fails
**Solution:**
```bash
# Check network connectivity
curl https://graphigo.prd.galaxy.eco/query
curl https://api.llama.fi/airdrops

# Check logs
tail -f .next/server.log
```

## Summary Checklist

- [ ] Unit tests pass (17/17)
- [ ] Database schema verified
- [ ] Admin seed script works
- [ ] Sync endpoint works (with auth)
- [ ] Airdrops feed returns data
- [ ] Personalized feed includes eligibility
- [ ] History endpoint works
- [ ] Performance meets targets (<5s sync, <2s API)
- [ ] Cache works correctly
- [ ] Error handling works
- [ ] Snapshot eligibility works

## Next Steps

Once all tests pass:
1. Deploy to staging environment
2. Configure Vercel cron job
3. Monitor sync job logs
4. Test with real wallet addresses
5. Integrate with Hunter UI

---

**Need Help?** Check the completion summary: `.kiro/specs/hunter-demand-side/TASK_4_AIRDROPS_MODULE_COMPLETE.md`
