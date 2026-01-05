# Integration Test Guide for Task 2

## Overview

This guide explains how to run comprehensive integration tests for the Edge Functions, validating the Two-Client Auth Pattern and Atomic Integrity.

**Test File**: `src/__tests__/integration/edge-functions.test.ts`

---

## Prerequisites

### 1. Supabase Project Setup

Ensure your Supabase project has:
- ✅ `user_wallets` table created with all required columns
- ✅ RLS policies configured (SELECT-only for authenticated users)
- ✅ All 5 Edge Functions deployed:
  - `wallets-list`
  - `wallets-add-watch`
  - `wallets-remove`
  - `wallets-remove-address`
  - `wallets-set-primary`

### 2. Environment Variables

Create a `.env.test` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test User (create a test user in Supabase Auth)
TEST_USER_ID=your-test-user-uuid
TEST_JWT_TOKEN=your-test-user-jwt-token
```

### 3. Create Test User

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new test user (e.g., `test@example.com`)
3. Copy the user UUID to `TEST_USER_ID`
4. Generate a JWT token for the test user:
   ```bash
   # Using Supabase CLI
   supabase auth admin create-user --email test@example.com --password testpass123
   ```

### 4. Generate JWT Token

To get a valid JWT token for testing:

```bash
# Option 1: Use Supabase CLI
supabase auth admin create-user --email test@example.com --password testpass123

# Option 2: Use Supabase JS client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpass123',
});

const token = data.session.access_token;
```

---

## Running the Tests

### Option 1: Run All Integration Tests

```bash
npm test -- src/__tests__/integration/edge-functions.test.ts --run
```

### Option 2: Run Specific Test Suite

```bash
# Test wallets-list
npm test -- src/__tests__/integration/edge-functions.test.ts -t "wallets-list" --run

# Test wallets-add-watch
npm test -- src/__tests__/integration/edge-functions.test.ts -t "wallets-add-watch" --run

# Test wallets-remove
npm test -- src/__tests__/integration/edge-functions.test.ts -t "wallets-remove" --run

# Test wallets-remove-address
npm test -- src/__tests__/integration/edge-functions.test.ts -t "wallets-remove-address" --run

# Test wallets-set-primary
npm test -- src/__tests__/integration/edge-functions.test.ts -t "wallets-set-primary" --run
```

### Option 3: Run with Coverage

```bash
npm test -- src/__tests__/integration/edge-functions.test.ts --coverage --run
```

---

## Test Cases Explained

### 1. wallets-list (Deterministic Ordering & Quota)

#### Test Case: Deterministic Sorting
- **Goal**: Ensure primary wallet appears first, others sorted by created_at DESC
- **Steps**:
  1. Create 3 wallets
  2. Set the second one as primary
  3. Call GET /functions/v1/wallets-list
  4. Verify primary wallet at index 0
  5. Verify others sorted by created_at DESC
- **Expected**: ✅ Primary first, deterministic ordering

#### Test Case: Quota Accuracy
- **Goal**: Verify quota counts unique addresses, not rows
- **Steps**:
  1. Add same address across 3 networks (Ethereum, Polygon, Arbitrum)
  2. Call GET /functions/v1/wallets-list
  3. Verify quota.used_addresses = 1
  4. Verify quota.used_rows = 3
- **Expected**: ✅ Quota correctly counts unique addresses

#### Test Case: Active Hint
- **Goal**: Verify active_hint includes primary wallet ID
- **Steps**:
  1. Create wallet with is_primary = true
  2. Call GET /functions/v1/wallets-list
  3. Verify active_hint.primary_wallet_id matches primary wallet
- **Expected**: ✅ Active hint correctly identifies primary

---

### 2. wallets-add-watch (Validation & Resolution)

#### Test Case: ENS Resolution
- **Goal**: Verify ENS names resolve to addresses
- **Steps**:
  1. Call POST /functions/v1/wallets-add-watch with "vitalik.eth"
  2. Verify status 200 OK
  3. Verify returned address is valid Ethereum address
- **Expected**: ✅ ENS resolves to address (or 422 if resolution fails)

#### Test Case: Security Rejection - Private Key
- **Goal**: Reject private key patterns
- **Steps**:
  1. Call POST /functions/v1/wallets-add-watch with 64-char hex string
  2. Verify status 422
  3. Verify error code = PRIVATE_KEY_DETECTED
- **Expected**: ✅ Private key rejected with 422

#### Test Case: Security Rejection - Seed Phrase
- **Goal**: Reject seed phrase patterns
- **Steps**:
  1. Call POST /functions/v1/wallets-add-watch with 12-word string
  2. Verify status 422
  3. Verify error code = SEED_PHRASE_DETECTED
- **Expected**: ✅ Seed phrase rejected with 422

#### Test Case: Idempotency
- **Goal**: Verify same request returns same result
- **Steps**:
  1. Call POST /functions/v1/wallets-add-watch with Idempotency-Key header
  2. Call again with same Idempotency-Key
  3. Verify both return 200 OK
  4. Verify only one row in database
- **Expected**: ✅ Idempotent - same result, no duplicates

#### Test Case: Duplicate Detection
- **Goal**: Reject duplicate address+network combinations
- **Steps**:
  1. Add wallet (address, network)
  2. Try to add same wallet again
  3. Verify status 409
  4. Verify error code = WALLET_DUPLICATE
- **Expected**: ✅ Duplicate rejected with 409

#### Test Case: First Wallet Primary
- **Goal**: Verify first wallet automatically becomes primary
- **Steps**:
  1. Call POST /functions/v1/wallets-add-watch for first wallet
  2. Verify response.wallet.is_primary = true
- **Expected**: ✅ First wallet is primary

#### Test Case: Second Wallet Not Primary
- **Goal**: Verify second wallet is not primary
- **Steps**:
  1. Add first wallet
  2. Add second wallet
  3. Verify response.wallet.is_primary = false
- **Expected**: ✅ Second wallet is not primary

---

### 3. wallets-remove (Atomic Reassignment)

#### Test Case: Primary Promotion
- **Goal**: Ensure new primary assigned atomically when primary deleted
- **Steps**:
  1. Create wallet A (primary) and wallet B (not primary)
  2. Call POST /functions/v1/wallets-remove for wallet A
  3. Verify response.new_primary_id = wallet B ID
  4. Verify wallet A deleted, wallet B is now primary
- **Expected**: ✅ Atomic primary reassignment

#### Test Case: Unauthorized Deletion
- **Goal**: Verify user cannot delete another user's wallet
- **Steps**:
  1. Create wallet for test user
  2. Try to delete with different user's JWT
  3. Verify status 403 or 404
- **Expected**: ✅ Unauthorized deletion prevented

#### Test Case: Non-existent Wallet
- **Goal**: Verify 404 for non-existent wallet
- **Steps**:
  1. Call POST /functions/v1/wallets-remove with fake wallet ID
  2. Verify status 404
  3. Verify error code = WALLET_NOT_FOUND
- **Expected**: ✅ 404 for non-existent wallet

---

### 4. wallets-remove-address (Mass Cleanup)

#### Test Case: Multi-Network Wipe
- **Goal**: Verify all rows for address deleted across networks
- **Steps**:
  1. Add same address to Ethereum, Polygon, Arbitrum
  2. Call POST /functions/v1/wallets-remove-address
  3. Verify response.deleted_count = 3
  4. Verify all rows deleted from database
- **Expected**: ✅ All rows deleted

#### Test Case: Primary Promotion on Address Removal
- **Goal**: Verify new primary assigned when primary address removed
- **Steps**:
  1. Create address1 (primary) and address2 (not primary)
  2. Call POST /functions/v1/wallets-remove-address for address1
  3. Verify response.new_primary_id is set
  4. Verify address2 is now primary
- **Expected**: ✅ Atomic primary reassignment

#### Test Case: Case-insensitive Matching
- **Goal**: Verify address matching is case-insensitive
- **Steps**:
  1. Add wallet with lowercase address
  2. Call POST /functions/v1/wallets-remove-address with uppercase
  3. Verify deleted_count = 1
- **Expected**: ✅ Case-insensitive matching works

#### Test Case: Non-existent Address
- **Goal**: Verify 404 for non-existent address
- **Steps**:
  1. Call POST /functions/v1/wallets-remove-address with non-existent address
  2. Verify status 404
  3. Verify error code = ADDRESS_NOT_FOUND
- **Expected**: ✅ 404 for non-existent address

---

### 5. wallets-set-primary (Atomic Updates)

#### Test Case: Primary Swap
- **Goal**: Verify only one primary at a time
- **Steps**:
  1. Create wallet A (primary) and wallet B (not primary)
  2. Call POST /functions/v1/wallets-set-primary for wallet B
  3. Verify wallet B is now primary
  4. Verify wallet A is no longer primary
  5. Verify exactly one primary in database
- **Expected**: ✅ Atomic primary swap

#### Test Case: Non-existent Wallet
- **Goal**: Verify 404 for non-existent wallet
- **Steps**:
  1. Call POST /functions/v1/wallets-set-primary with fake wallet ID
  2. Verify status 404
- **Expected**: ✅ 404 for non-existent wallet

#### Test Case: Atomic Constraint
- **Goal**: Verify never zero primaries
- **Steps**:
  1. Create 3 wallets
  2. Set wallet2 as primary
  3. Set wallet3 as primary
  4. Verify exactly one primary at each step
- **Expected**: ✅ Always exactly one primary

---

### 6. CORS & Authentication

#### Test Case: OPTIONS Preflight
- **Goal**: Verify OPTIONS preflight succeeds
- **Steps**:
  1. Send OPTIONS request to Edge Function
  2. Verify status 200
  3. Verify CORS headers present
- **Expected**: ✅ Preflight succeeds

#### Test Case: Missing Authorization
- **Goal**: Verify 401 without Authorization header
- **Steps**:
  1. Call Edge Function without Authorization header
  2. Verify status 401
  3. Verify error code = UNAUTHORIZED
- **Expected**: ✅ 401 without auth

#### Test Case: Invalid JWT
- **Goal**: Verify 401 with invalid JWT
- **Steps**:
  1. Call Edge Function with invalid JWT
  2. Verify status 401
  3. Verify error code = UNAUTHORIZED
- **Expected**: ✅ 401 with invalid JWT

---

## Troubleshooting

### Issue: Tests fail with "SUPABASE_URL not set"

**Solution**: Ensure `.env.test` file exists with all required variables:
```bash
cp .env.example .env.test
# Edit .env.test with your Supabase credentials
```

### Issue: Tests fail with "401 Unauthorized"

**Solution**: Verify JWT token is valid:
```bash
# Check token expiration
jwt decode <your-token>

# Generate new token if expired
supabase auth admin create-user --email test@example.com --password testpass123
```

### Issue: Tests fail with "user_wallets table not found"

**Solution**: Ensure table exists in Supabase:
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain_namespace TEXT DEFAULT 'eip155:1',
  is_primary BOOLEAN DEFAULT false,
  guardian_scores JSONB DEFAULT '{}'::jsonb,
  balance_cache JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Issue: Tests fail with "Edge Function not found"

**Solution**: Ensure Edge Functions are deployed:
```bash
# Deploy Edge Functions
supabase functions deploy wallets-list
supabase functions deploy wallets-add-watch
supabase functions deploy wallets-remove
supabase functions deploy wallets-remove-address
supabase functions deploy wallets-set-primary
```

---

## Expected Test Results

When all tests pass, you should see:

```
✓ src/__tests__/integration/edge-functions.test.ts (30 tests)
  ✓ 1. wallets-list (Deterministic Ordering & Quota) (3 tests)
    ✓ Test Case: Deterministic Sorting - Primary wallet appears first
    ✓ Test Case: Quota Accuracy - Unique addresses counted correctly
    ✓ Test Case: Active Hint - Primary wallet ID included
  ✓ 2. wallets-add-watch (Validation & Resolution) (7 tests)
    ✓ Test Case: ENS Resolution - vitalik.eth resolves to address
    ✓ Test Case: Security Rejection - Private key pattern detected
    ✓ Test Case: Security Rejection - Seed phrase pattern detected
    ✓ Test Case: Idempotency - Same request returns same result
    ✓ Test Case: Duplicate Detection - Same address+network rejected
    ✓ Test Case: First wallet becomes primary automatically
    ✓ Test Case: Second wallet is not primary
  ✓ 3. wallets-remove (Atomic Reassignment) (3 tests)
    ✓ Test Case: Primary Promotion - New primary assigned atomically
    ✓ Test Case: Unauthorized Deletion - Different user cannot delete wallet
    ✓ Test Case: Non-existent wallet returns 404
  ✓ 4. wallets-remove-address (Mass Cleanup) (4 tests)
    ✓ Test Case: Multi-Network Wipe - All rows for address deleted
    ✓ Test Case: Primary Promotion on Address Removal
    ✓ Test Case: Case-insensitive address matching
    ✓ Test Case: Non-existent address returns 404
  ✓ 5. wallets-set-primary (Atomic Updates) (3 tests)
    ✓ Test Case: Primary Swap - Only one primary at a time
    ✓ Test Case: Non-existent wallet returns 404
    ✓ Test Case: Atomic constraint - Never zero primaries
  ✓ CORS & Authentication (3 tests)
    ✓ OPTIONS preflight request succeeds
    ✓ Missing Authorization header returns 401
    ✓ Invalid JWT returns 401

Test Files  1 passed (1)
Tests       30 passed (30)
```

---

## Next Steps

After all integration tests pass:

1. ✅ Task 2 is complete
2. Proceed to Task 3: Database Security & Constraints
3. Proceed to Task 4: Wallet Shape Adapter
4. Continue with remaining tasks in the implementation plan

---

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Vitest Documentation](https://vitest.dev/)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
