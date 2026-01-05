# Integration Test Execution Checklist

## Pre-Test Setup

### Environment Configuration
- [x] `.env.test` file created with all required variables
- [x] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly
- [x] `SUPABASE_SERVICE_ROLE_KEY` set correctly
- [x] `TEST_USER_ID` set to valid test user UUID
- [ ] `TEST_JWT_TOKEN` set to valid JWT token

### Supabase Project Setup
- [ ] `user_wallets` table exists with all columns
- [ ] RLS policies configured (SELECT-only for authenticated)
- [ ] All 5 Edge Functions deployed and accessible
- [ ] Test user created in Supabase Auth
- [ ] JWT token generated for test user

### Database Verification
- [ ] Run: `SELECT * FROM user_wallets WHERE user_id = '<TEST_USER_ID>'` returns empty
- [ ] Verify table structure matches requirements
- [ ] Verify RLS policies are active

---

## Test Execution

### 1. wallets-list Tests

#### Test: Deterministic Sorting
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Deterministic Sorting" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Primary wallet at index 0
- [ ] Verify: Others sorted by created_at DESC

#### Test: Quota Accuracy
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Quota Accuracy" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: used_addresses = 1 (unique count)
- [ ] Verify: used_rows = 3 (total rows)

#### Test: Active Hint
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Active Hint" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: primary_wallet_id matches primary wallet

**Status**: [ ] All wallets-list tests passing

---

### 2. wallets-add-watch Tests

#### Test: ENS Resolution
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "ENS Resolution" --run`
- [ ] Expected: ✅ PASS (or 422 if ENS unavailable)
- [ ] Verify: Returns valid Ethereum address or ENS_RESOLUTION_FAILED

#### Test: Private Key Detection
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Private key pattern" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 422
- [ ] Verify: Error code = PRIVATE_KEY_DETECTED

#### Test: Seed Phrase Detection
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Seed phrase pattern" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 422
- [ ] Verify: Error code = SEED_PHRASE_DETECTED

#### Test: Idempotency
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Idempotency" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Both requests return 200 OK
- [ ] Verify: Only one row in database
- [ ] Verify: Same wallet ID returned

#### Test: Duplicate Detection
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Duplicate Detection" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: First add returns 200 OK
- [ ] Verify: Second add returns 409 Conflict
- [ ] Verify: Error code = WALLET_DUPLICATE

#### Test: First Wallet Primary
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "First wallet becomes primary" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: is_primary = true

#### Test: Second Wallet Not Primary
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Second wallet is not primary" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: is_primary = false

**Status**: [ ] All wallets-add-watch tests passing

---

### 3. wallets-remove Tests

#### Test: Primary Promotion
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Primary Promotion" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 200 OK
- [ ] Verify: new_primary_id is set
- [ ] Verify: Wallet A deleted
- [ ] Verify: Wallet B is now primary
- [ ] Verify: Atomic transaction (no intermediate state)

#### Test: Unauthorized Deletion
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Unauthorized Deletion" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: User scoping works correctly

#### Test: Non-existent Wallet
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Non-existent wallet returns 404" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 404
- [ ] Verify: Error code = WALLET_NOT_FOUND

**Status**: [ ] All wallets-remove tests passing

---

### 4. wallets-remove-address Tests

#### Test: Multi-Network Wipe
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Multi-Network Wipe" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 200 OK
- [ ] Verify: deleted_count = 3
- [ ] Verify: All rows deleted from database

#### Test: Primary Promotion on Address Removal
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Primary Promotion on Address Removal" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: new_primary_id is set
- [ ] Verify: Address2 is now primary
- [ ] Verify: Atomic transaction

#### Test: Case-insensitive Matching
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Case-insensitive address matching" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Uppercase address matches lowercase in DB
- [ ] Verify: deleted_count = 1

#### Test: Non-existent Address
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Non-existent address returns 404" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 404
- [ ] Verify: Error code = ADDRESS_NOT_FOUND

**Status**: [ ] All wallets-remove-address tests passing

---

### 5. wallets-set-primary Tests

#### Test: Primary Swap
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Primary Swap" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 200 OK
- [ ] Verify: Wallet B is now primary
- [ ] Verify: Wallet A is no longer primary
- [ ] Verify: Exactly one primary in database
- [ ] Verify: Atomic transaction

#### Test: Non-existent Wallet
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Non-existent wallet returns 404" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 404

#### Test: Atomic Constraint
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Atomic constraint" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Always exactly one primary
- [ ] Verify: No intermediate state with zero primaries

**Status**: [ ] All wallets-set-primary tests passing

---

### 6. CORS & Authentication Tests

#### Test: OPTIONS Preflight
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "OPTIONS preflight" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 200
- [ ] Verify: CORS headers present

#### Test: Missing Authorization
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Missing Authorization" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 401
- [ ] Verify: Error code = UNAUTHORIZED

#### Test: Invalid JWT
- [ ] Run test: `npm test -- src/__tests__/integration/edge-functions.test.ts -t "Invalid JWT" --run`
- [ ] Expected: ✅ PASS
- [ ] Verify: Status 401
- [ ] Verify: Error code = UNAUTHORIZED

**Status**: [ ] All CORS & Authentication tests passing

---

## Full Test Suite Execution

### Run All Tests
- [ ] Command: `npm test -- src/__tests__/integration/edge-functions.test.ts --run`
- [ ] Expected: All 30 tests pass
- [ ] Duration: < 60 seconds

### Expected Output
```
✓ src/__tests__/integration/edge-functions.test.ts (30 tests)
  ✓ 1. wallets-list (3 tests)
  ✓ 2. wallets-add-watch (7 tests)
  ✓ 3. wallets-remove (3 tests)
  ✓ 4. wallets-remove-address (4 tests)
  ✓ 5. wallets-set-primary (3 tests)
  ✓ CORS & Authentication (3 tests)

Test Files  1 passed (1)
Tests       30 passed (30)
```

---

## Post-Test Verification

### Database State
- [ ] Run: `SELECT COUNT(*) FROM user_wallets WHERE user_id = '<TEST_USER_ID>'`
- [ ] Expected: 0 (all test data cleaned up)

### Edge Function Logs
- [ ] Check Supabase Edge Function logs for errors
- [ ] Verify no 500 errors in logs
- [ ] Verify all requests properly authenticated

### Performance Metrics
- [ ] Average response time < 500ms
- [ ] No timeout errors
- [ ] No rate limiting errors

---

## Troubleshooting Checklist

### If Tests Fail

#### Check 1: Environment Variables
- [ ] Verify `.env.test` exists
- [ ] Verify all variables are set
- [ ] Verify no typos in variable names
- [ ] Verify JWT token is not expired

#### Check 2: Supabase Connection
- [ ] Verify SUPABASE_URL is correct
- [ ] Verify SUPABASE_ANON_KEY is correct
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY is correct
- [ ] Test connection: `curl https://your-project.supabase.co/rest/v1/`

#### Check 3: Edge Functions
- [ ] Verify all 5 Edge Functions are deployed
- [ ] Check Edge Function logs for errors
- [ ] Verify Edge Functions are accessible
- [ ] Test manually: `curl -X GET https://your-project.supabase.co/functions/v1/wallets-list`

#### Check 4: Database
- [ ] Verify user_wallets table exists
- [ ] Verify RLS policies are enabled
- [ ] Verify test user exists in auth.users
- [ ] Verify no data corruption

#### Check 5: JWT Token
- [ ] Verify JWT token is valid
- [ ] Verify JWT token is not expired
- [ ] Verify JWT token contains correct user_id
- [ ] Generate new token if needed

---

## Sign-Off

### Test Execution Complete
- [ ] All 30 tests passing
- [ ] No errors or warnings
- [ ] Database cleaned up
- [ ] Performance acceptable

### Task 2 Validation Complete
- [ ] ✅ GET /functions/v1/wallets-list returns deterministic ordering
- [ ] ✅ POST /functions/v1/wallets-add-watch with ENS resolution and validation
- [ ] ✅ POST /functions/v1/wallets-remove with atomic primary reassignment
- [ ] ✅ POST /functions/v1/wallets-remove-address removes all rows for address
- [ ] ✅ POST /functions/v1/wallets-set-primary with atomic updates
- [ ] ✅ All functions use JWT validation + service role pattern
- [ ] ✅ CORS preflight handling for all functions
- [ ] ✅ Exact API shapes match requirements specification

### Ready for Next Task
- [ ] Task 2 complete and validated
- [ ] Proceed to Task 3: Database Security & Constraints
- [ ] All Edge Functions production-ready

---

## Notes

- Tests are designed to be idempotent (can be run multiple times)
- Each test cleans up after itself
- Tests use real Supabase project (not mocked)
- Tests validate both happy path and error cases
- Tests verify atomic transactions and data consistency

---

**Date Completed**: _______________
**Tester Name**: _______________
**Notes**: _______________
