# Hunter Airdrops API Testing Guide

## Quick Start

### Option 1: Browser-Based Testing (Recommended for Quick Validation)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the test page:**
   ```
   http://localhost:3000/test-hunter-airdrops-api.html
   ```

3. **View results:**
   - Tests auto-run on page load
   - See pass/fail statistics in real-time
   - Click "Run All Tests" to re-run
   - Click "Clear Results" to reset

### Option 2: Integration Tests (For CI/CD)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Run integration tests in another terminal:**
   ```bash
   npm test -- src/__tests__/integration/hunter-airdrops-api.integration.test.ts --run
   ```

## What's Being Tested

### Non-Personalized Feed: `GET /api/hunter/airdrops`

This endpoint returns airdrop opportunities WITHOUT wallet-based personalization.

**Expected Behavior:**
- Returns only `type='airdrop'` opportunities
- Returns only `status='published'` opportunities
- Sorted by `created_at` descending
- NO `eligibility_preview` field
- NO `ranking` field
- Response format: `{ items: [], cursor: null, ts: "ISO8601" }`

### Test Categories

1. **Basic Endpoint Functionality** (6 tests)
   - HTTP 200 response
   - JSON content type
   - Required fields present
   - Valid timestamp format

2. **Airdrop Filtering** (3 tests)
   - Only airdrop type
   - Only published status
   - No draft/expired items

3. **Opportunity Data Structure** (5 tests)
   - Core fields (id, slug, title, type, status, created_at)
   - Airdrop fields (snapshot_date, claim_start, claim_end, airdrop_category)
   - Trust score validation (0-100)
   - Chains array validation

4. **Non-Personalized Behavior** (3 tests)
   - No eligibility_preview field
   - No ranking field
   - Correct sorting (created_at DESC)

5. **Pagination and Limits** (2 tests)
   - Max 100 items
   - Empty results handling

6. **Error Handling** (2 tests)
   - Database error handling
   - Error response format

7. **HTTP Method Validation** (4 tests)
   - GET accepted
   - POST rejected (404/405)
   - PUT rejected (404/405)
   - DELETE rejected (404/405)

8. **Performance** (2 tests)
   - Response time < 2 seconds
   - Concurrent request handling

9. **Data Consistency** (2 tests)
   - Consistent results across requests
   - Recent timestamps

10. **Source and Reference Fields** (2 tests)
    - Valid source values (admin, galxe, defillama)
    - Source ref field present

11. **Requirements Field Validation** (2 tests)
    - Requirements field structure
    - Valid requirement keys

## Test Data Requirements

### Minimum Test Data

To run all tests successfully, you need:

1. **At least 1 airdrop opportunity** in the database with:
   - `type = 'airdrop'`
   - `status = 'published'`
   - Valid `created_at` timestamp

2. **Recommended: 10+ airdrop opportunities** for better test coverage

### Seeding Test Data

```bash
# Seed airdrops (creates 12 opportunities)
npm run seed:airdrops

# Verify data
# Open Supabase Studio and check opportunities table
# Filter: type='airdrop' AND status='published'
```

## Expected Test Results

### All Tests Passing

```
✅ 32/32 tests passed
```

**Indicates:**
- Endpoint is working correctly
- Response format matches API contract
- Filtering logic is correct
- Non-personalized behavior is correct
- Performance is acceptable

### Common Failures

#### No Airdrops in Database

```
ℹ️ Airdrop Filtering: No airdrops in database to test filtering
```

**Solution:** Run `npm run seed:airdrops`

#### Server Not Running

```
❌ ECONNREFUSED ::1:3000
```

**Solution:** Start dev server with `npm run dev`

#### Slow Response Times

```
❌ Response Time: Responded in 2500ms (should be < 2000ms)
```

**Possible Causes:**
- Database query slow (check indexes)
- Too many opportunities (pagination working?)
- Network latency

## Troubleshooting

### Tests Fail: "No opportunities returned"

**Check:**
1. Database has airdrop opportunities: `SELECT COUNT(*) FROM opportunities WHERE type='airdrop' AND status='published';`
2. Supabase connection is working
3. RLS policies allow anonymous reads

### Tests Fail: "Invalid response format"

**Check:**
1. API route exists: `src/app/api/hunter/airdrops/route.ts`
2. No TypeScript errors: `npm run type-check`
3. Server logs for errors

### Tests Fail: "Personalization fields present"

**Check:**
1. No `wallet` query parameter in request
2. API route correctly checks for `walletAddress` parameter
3. Response doesn't include `eligibility_preview` or `ranking`

## Next Steps

After non-personalized feed tests pass:

1. **Test personalized feed** with wallet parameter
2. **Test history endpoint** for user-specific airdrop history
3. **Verify eligibility preview** appears with wallet
4. **Verify ranking scores** appear with wallet

## Files

- **Integration Tests**: `src/__tests__/integration/hunter-airdrops-api.integration.test.ts`
- **Browser Tests**: `test-hunter-airdrops-api.html`
- **API Implementation**: `src/app/api/hunter/airdrops/route.ts`
- **Test Status**: `.kiro/specs/hunter-demand-side/TASK_4_TESTING_STATUS.md`
- **Completion Summary**: `.kiro/specs/hunter-demand-side/TASK_4_AIRDROPS_API_TESTING_COMPLETE.md`

## Requirements Validated

- ✅ Requirement 1.1-1.7: API route enhancement with ranking (non-personalized path)
- ✅ Requirement 14.5: Airdrop-specific API endpoint
- ✅ Requirement 7.1-7.5: API response contract

---

**Last Updated**: January 28, 2026
**Test Coverage**: 32 test cases
**Status**: ✅ Complete
