# Airdrop History Endpoint Testing Guide

## Overview

This guide provides manual testing instructions for the `GET /api/hunter/airdrops/history?wallet=<address>` endpoint.

**Endpoint:** `/api/hunter/airdrops/history`  
**Method:** GET  
**Query Parameters:** `wallet` (required) - Ethereum wallet address  
**Requirements:** 14.6

## Prerequisites

1. Development server running: `npm run dev`
2. Database seeded with airdrop opportunities
3. Test wallet address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

## Test Scenarios

### 1. Basic Functionality

#### Test 1.1: Valid Wallet Address
```bash
curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "opportunity_id": "uuid",
      "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "status": "eligible|maybe|unlikely|claimed|missed|expired",
      "claim_amount": null,
      "claimed_at": null,
      "updated_at": "2026-01-29T...",
      "opportunity": {
        "id": "uuid",
        "title": "Arbitrum Airdrop",
        "type": "airdrop",
        ...
      }
    }
  ],
  "ts": "2026-01-29T..."
}
```

**Verify:**
- ✅ Status code: 200
- ✅ Response is valid JSON
- ✅ `items` is an array
- ✅ `ts` is ISO 8601 timestamp
- ✅ Each item has required fields

#### Test 1.2: Missing Wallet Parameter
```bash
curl "http://localhost:3000/api/hunter/airdrops/history"
```

**Expected Response:**
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "wallet parameter is required"
  }
}
```

**Verify:**
- ✅ Status code: 400
- ✅ Error object with code and message

#### Test 1.3: Empty History
```bash
curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x0000000000000000000000000000000000000001"
```

**Expected Response:**
```json
{
  "items": [],
  "ts": "2026-01-29T..."
}
```

**Verify:**
- ✅ Status code: 200
- ✅ Empty items array
- ✅ Valid timestamp

### 2. Status Categories

The endpoint should return history items with different status values:

#### Status: `eligible`
- User qualifies for the airdrop
- `claimed_at` should be null
- `claim_amount` may be null

#### Status: `maybe`
- Uncertain eligibility
- `claimed_at` should be null

#### Status: `unlikely`
- User does not qualify
- `claimed_at` should be null

#### Status: `claimed`
- Airdrop was successfully claimed
- `claimed_at` should have a timestamp
- `claim_amount` should have a value

#### Status: `missed`
- Claim window was missed
- `claimed_at` should be null

#### Status: `expired`
- Claim period has ended
- `claimed_at` should be null

### 3. Data Structure Validation

#### Test 3.1: Required Fields
Each history item must have:
- `id` (UUID)
- `user_id` (UUID)
- `opportunity_id` (UUID)
- `wallet_address` (string)
- `status` (enum)
- `updated_at` (timestamp)

#### Test 3.2: Nested Opportunity Data
Each item should include nested `opportunity` object with:
- `id`
- `title`
- `type` (should be 'airdrop')
- `description`
- `chains`
- `trust_score`

### 4. Sorting and Ordering

#### Test 4.1: Sort by Updated At
```bash
curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Verify:**
- ✅ Items are sorted by `updated_at` descending (most recent first)
- ✅ First item has the most recent `updated_at` timestamp

### 5. Case Sensitivity

#### Test 5.1: Lowercase Address
```bash
curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x742d35cc6634c0532925a3b844bc9e7595f0beb"
```

**Verify:**
- ✅ Status code: 200
- ✅ Returns same results as mixed-case address

#### Test 5.2: Uppercase Address
```bash
curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x742D35CC6634C0532925A3B844BC9E7595F0BEB"
```

**Verify:**
- ✅ Status code: 200
- ✅ Returns same results as mixed-case address

### 6. Performance

#### Test 6.1: Response Time
```bash
time curl "http://localhost:3000/api/hunter/airdrops/history?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Verify:**
- ✅ Response time < 2 seconds

### 7. Browser Testing

Open in browser:
```
http://localhost:3000/api/hunter/airdrops/history?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Verify:**
- ✅ JSON is properly formatted
- ✅ No CORS errors in console
- ✅ Response displays correctly

## Integration Test Suite

The comprehensive integration test suite is located at:
```
src/__tests__/integration/hunter-airdrops-history-api.integration.test.ts
```

### Running Integration Tests

**Prerequisites:**
1. Start development server: `npm run dev`
2. Ensure database is seeded

**Run tests:**
```bash
npm test -- src/__tests__/integration/hunter-airdrops-history-api.integration.test.ts --run
```

### Test Coverage

The integration test suite includes 26 tests covering:

1. **Basic Endpoint Functionality** (6 tests)
   - 200 OK response
   - Valid JSON
   - Required fields (items, ts)
   - Array validation
   - Timestamp format
   - Cursor field

2. **Wallet Parameter Validation** (4 tests)
   - Missing parameter (400 error)
   - Valid address format
   - Lowercase address
   - Uppercase address

3. **History Item Structure** (6 tests)
   - Required fields
   - Valid status values
   - Wallet address matching
   - Nested opportunity data
   - Claim amount for claimed status
   - Claimed timestamp for claimed status

4. **Sorting and Ordering** (1 test)
   - Descending order by updated_at

5. **Empty History Handling** (1 test)
   - Empty array for wallet with no history

6. **Status Categories** (6 tests)
   - Eligible status
   - Maybe status
   - Unlikely status
   - Claimed status
   - Missed status
   - Expired status

7. **Performance** (1 test)
   - Response time < 2 seconds

8. **Error Handling** (1 test)
   - Graceful database error handling

9. **Case Sensitivity** (1 test)
   - Mixed-case wallet addresses

## Expected Test Results

When the development server is running and the database is properly seeded:

```
✓ GET /api/hunter/airdrops/history - Airdrop History (26 tests)
  ✓ Basic Endpoint Functionality (6)
  ✓ Wallet Parameter Validation (4)
  ✓ History Item Structure (6)
  ✓ Sorting and Ordering (1)
  ✓ Empty History Handling (1)
  ✓ Status Categories (6)
  ✓ Performance (1)
  ✓ Error Handling (1)
  ✓ Case Sensitivity (1)

Test Files  1 passed (1)
     Tests  26 passed (26)
```

## Troubleshooting

### Issue: Connection Refused
**Symptom:** `ECONNREFUSED ::1:3000` or `ECONNREFUSED 127.0.0.1:3000`

**Solution:**
1. Ensure development server is running: `npm run dev`
2. Check that port 3000 is not in use by another process
3. Verify `NEXT_PUBLIC_BASE_URL` environment variable

### Issue: Empty Items Array
**Symptom:** All tests pass but `items` array is always empty

**Solution:**
1. Check if `user_airdrop_status` table has data
2. Verify wallet address exists in database
3. Run seed scripts if needed

### Issue: 500 Internal Server Error
**Symptom:** Tests fail with 500 status code

**Solution:**
1. Check server logs for database errors
2. Verify Supabase connection
3. Ensure `user_airdrop_status` table exists
4. Check RLS policies

## Manual Verification Checklist

- [ ] Endpoint returns 200 for valid wallet address
- [ ] Endpoint returns 400 when wallet parameter is missing
- [ ] Response includes `items` array and `ts` timestamp
- [ ] Items are sorted by `updated_at` descending
- [ ] Each item has all required fields
- [ ] Nested `opportunity` object is included
- [ ] Status values are valid (eligible, maybe, unlikely, claimed, missed, expired)
- [ ] Claimed items have `claimed_at` timestamp
- [ ] Wallet address matching is case-insensitive
- [ ] Empty history returns empty array (not error)
- [ ] Response time is under 2 seconds
- [ ] Error responses have proper structure

## Next Steps

After verifying the history endpoint:

1. ✅ Mark task as complete in `tasks.md`
2. ⏭️ Run integration tests for all modules (Phase 4)
3. ⏭️ End-to-end testing with real wallet connections (Phase 5)
4. ⏭️ Performance testing under load (Phase 6)

## Related Documentation

- **Requirements:** `.kiro/specs/hunter-demand-side/requirements.md` (Requirement 14.6)
- **Design:** `.kiro/specs/hunter-demand-side/design.md`
- **Tasks:** `.kiro/specs/hunter-demand-side/tasks.md` (Task 4.4)
- **API Implementation:** `src/app/api/hunter/airdrops/history/route.ts`
- **Integration Tests:** `src/__tests__/integration/hunter-airdrops-history-api.integration.test.ts`
- **Testing Status:** `.kiro/specs/hunter-demand-side/TASK_4_TESTING_STATUS.md`
