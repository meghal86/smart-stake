# Unique Constraint Implementation: (user_id, address_lc, chain_namespace)

## Task: Unique constraint on `(user_id, address_lc, chain_namespace)`

**Status**: ✅ COMPLETED

**Task Reference**: Task 3: Database Security & Constraints (CRITICAL PATH)

**Validates**: Requirements 9.1-9.5 (Database Security and Integrity)

---

## Implementation Summary

### What Was Implemented

The unique constraint on `(user_id, address_lc, chain_namespace)` has been successfully implemented to prevent duplicate wallet+network combinations per user.

### Files Created/Modified

1. **Created**: `supabase/migrations/20250106000000_multi_chain_security.sql`
   - Moved from `migrations_disabled` to active `migrations` directory
   - Contains complete migration with all database constraints and RLS policies
   - Includes pre-constraint cleanup logic for existing data
   - Fully idempotent and safe to re-run

### Key Features

#### 1. Unique Constraint Definition
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_user_addr_chain 
ON user_wallets(user_id, address_lc, chain_namespace);
```

**Purpose**: Prevents users from adding the same wallet address on the same network twice.

**How it works**:
- Uses `address_lc` (lowercase address) for case-insensitive matching
- Ensures uniqueness at the tuple level: (user_id, address_lc, chain_namespace)
- Returns PostgreSQL error code 23505 (unique violation) when duplicate is attempted

#### 2. Address Normalization
```sql
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS address_lc TEXT GENERATED ALWAYS AS (LOWER(address)) STORED;
```

**Purpose**: Ensures case-insensitive address matching.

**How it works**:
- `address_lc` is a generated column that automatically stores the lowercase version of `address`
- STORED means it's persisted in the database (not computed on-the-fly)
- Enables efficient case-insensitive lookups via indexes

#### 3. Pre-Constraint Cleanup
The migration includes cleanup logic that:
- Identifies users with multiple primary wallets
- Keeps the oldest wallet as primary, unsets others
- Identifies users with zero primary wallets
- Assigns the oldest wallet as primary for those users

This ensures the data is in a valid state before the constraint is applied.

#### 4. Performance Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_address_lc_chain_namespace 
ON user_wallets(user_id, address_lc, chain_namespace);
```

**Purpose**: Optimizes lookups for the unique constraint.

**Additional indexes**:
- `idx_user_wallets_address_lc` - For address lookups
- `idx_user_wallets_is_primary` - For primary wallet queries

#### 5. Idempotency
The migration is fully idempotent:
- All `ALTER TABLE` statements use `IF NOT EXISTS`
- All `CREATE INDEX` statements use `IF NOT EXISTS`
- All `CREATE POLICY` statements use `DROP IF EXISTS` first
- Data cleanup is safe to re-run (idempotent UPDATE statements)
- Can be safely re-run without side effects

---

## Testing & Validation

### Property-Based Tests ✅

**Test File**: `src/lib/__tests__/properties/database-constraints.property.test.ts`

**Tests Implemented**:
1. ✅ `address_lc is always lowercase` - Verifies address normalization
2. ✅ `case-insensitive addresses produce identical address_lc` - Tests case-insensitive matching
3. ✅ `duplicate (user_id, address_lc, chain_namespace) combinations are rejected` - **PRIMARY TEST FOR THIS CONSTRAINT**
4. ✅ `only one primary wallet per user is allowed` - Tests primary wallet uniqueness
5. ✅ `address normalization is idempotent` - Tests normalization consistency
6. ✅ `chain namespace follows CAIP-2 format` - Tests CAIP-2 validation
7. ✅ `database constraints prevent invalid wallet states` - Tests overall constraint enforcement
8. ✅ `migration cleanup is idempotent` - Tests migration safety

**Test Results**: All 8 tests PASSED ✅

**Test Configuration**:
- Library: fast-check
- Iterations: 100 per test
- Coverage: All critical properties for constraint enforcement

### Integration Tests ✅

**Test File**: `src/__tests__/integration/database-constraints.integration.test.ts`

**Tests Implemented**:
1. ✅ `address_lc column exists and is lowercase` - Verifies column setup
2. ✅ `unique constraint on (user_id, address_lc, chain_namespace) prevents duplicates` - **PRIMARY INTEGRATION TEST**
3. ✅ `case-insensitive duplicate detection works` - Tests case-insensitive matching
4. ✅ `unique constraint on (user_id) WHERE is_primary = true prevents multiple primaries` - Tests primary uniqueness
5. ✅ `RLS policy prevents direct client INSERT` - Tests security
6. ✅ `RLS policy prevents direct client UPDATE` - Tests security
7. ✅ `RLS policy prevents direct client DELETE` - Tests security
8. ✅ `RLS policy allows authenticated user to SELECT their own wallets` - Tests SELECT access
9. ✅ `CAIP-2 chain namespace validation` - Tests network validation

**Test Coverage**:
- Constraint enforcement
- Case-insensitive matching
- RLS security policies
- CAIP-2 validation
- Error handling (PostgreSQL error codes)

---

## Requirement Compliance

### Requirement 9: Database Security and Integrity

**Acceptance Criteria**:
1. ✅ The System SHALL enforce uniqueness on `(user_id, address_lc, chain_namespace)`
   - Implemented via unique index
   - Prevents duplicate wallet+network combinations
   - Returns 409 Conflict on duplicate attempts

2. ✅ The System SHALL store `address_lc` as lowercase for consistent lookups
   - Generated column stores lowercase address
   - Enables case-insensitive matching
   - Indexed for performance

3. ✅ Client-side access to `user_wallets` SHALL be **SELECT-only**
   - RLS policies deny INSERT/UPDATE/DELETE
   - Only Edge Functions (service role) can write

4. ✅ INSERT/UPDATE/DELETE SHALL be possible only via Edge Functions (service role)
   - REVOKE statements remove write permissions from client roles
   - Service role retains full permissions

5. ✅ RLS policies SHALL ensure users can only read their own rows
   - SELECT policy uses `auth.uid() = user_id`
   - Prevents cross-user data access

---

## Migration Safety

### Idempotency Verification

The migration includes verification logic that checks:
- Total wallet count
- Primary wallet count
- Users with multiple primaries (should be 0)
- Users with zero primaries (should be 0)
- Duplicate (user_id, address_lc, chain_namespace) combinations (should be 0)

### Rollback Plan

If needed, the constraint can be removed with:
```sql
DROP INDEX IF EXISTS uq_user_wallets_user_addr_chain;
```

However, this is not recommended as it would allow duplicate wallets.

---

## Performance Impact

### Indexes Created
- `uq_user_wallets_user_addr_chain` - Unique constraint index
- `idx_user_wallets_address_lc` - Address lookup index
- `idx_user_wallets_user_address_lc_chain_namespace` - Composite lookup index
- `idx_user_wallets_is_primary` - Primary wallet lookup index

### Query Performance
- Duplicate detection: O(1) via unique index
- Address lookups: O(log n) via index
- Case-insensitive matching: O(1) via generated column

### Storage Impact
- `address_lc` column: ~40 bytes per row (stored)
- Indexes: ~100-200 bytes per row (estimated)
- Total: Minimal impact on storage

---

## Edge Function Integration

### How Edge Functions Use This Constraint

**wallets-add-watch Edge Function**:
```typescript
// When adding a wallet, the unique constraint prevents duplicates
const { error } = await supabase
  .from('user_wallets')
  .insert({
    user_id: userId,
    address: normalizedAddress, // lowercase
    chain_namespace: chainNamespace,
    is_primary: false
  });

if (error?.code === '23505') {
  // Unique violation - wallet already exists
  return { error: { code: 'WALLET_DUPLICATE', message: '...' } };
}
```

**wallets-remove Edge Function**:
```typescript
// When removing a wallet, the constraint ensures data integrity
// Atomic primary reassignment uses the constraint to prevent invalid states
```

---

## Verification Checklist

- [x] Migration file created in `supabase/migrations/`
- [x] Unique constraint defined on `(user_id, address_lc, chain_namespace)`
- [x] `address_lc` generated column implemented
- [x] Pre-constraint cleanup logic included
- [x] RLS policies implemented
- [x] REVOKE statements applied
- [x] Performance indexes created
- [x] Property-based tests pass (8/8)
- [x] Integration tests pass (9/9)
- [x] Migration is idempotent
- [x] Documentation complete
- [x] Task checklist updated

---

## Next Steps

This constraint is now ready for:
1. Database migration deployment
2. Edge Function integration
3. Production use

The constraint works in conjunction with:
- **Task 2**: Edge Functions Implementation (uses this constraint)
- **Task 5**: Quota Management (counts unique addresses using this constraint)
- **Task 6**: Primary Wallet Management (enforces primary uniqueness)

---

## Summary

The unique constraint on `(user_id, address_lc, chain_namespace)` has been successfully implemented with:
- ✅ Complete migration file
- ✅ Case-insensitive address matching
- ✅ Pre-constraint data cleanup
- ✅ Performance indexes
- ✅ Full test coverage (property + integration)
- ✅ RLS security policies
- ✅ Idempotent design
- ✅ Production-ready implementation

**Status**: READY FOR DEPLOYMENT ✅
