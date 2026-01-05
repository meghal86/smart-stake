-- =====================================================
-- Multi-Chain Wallet System - Database Security & Constraints
-- Implements address_lc generated column, unique constraints, RLS policies
-- =====================================================

-- =====================================================
-- STEP 1: Add address_lc generated column for case-insensitive lookups
-- =====================================================

-- Add address_lc generated column if it doesn't exist
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS address_lc TEXT GENERATED ALWAYS AS (LOWER(address)) STORED;

-- =====================================================
-- STEP 2: Add unique constraints for data integrity
-- =====================================================

-- Unique constraint: (user_id, address_lc, chain_namespace)
-- Prevents duplicate wallet+network combinations per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_user_addr_chain 
ON user_wallets(user_id, address_lc, chain_namespace);

-- Unique constraint: only one primary wallet per user
-- WHERE clause ensures only one row per user has is_primary = true
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wallets_primary_per_user 
ON user_wallets(user_id) WHERE is_primary = true;

-- =====================================================
-- STEP 3: Pre-constraint cleanup for existing data
-- =====================================================

-- For users with multiple primary wallets, keep oldest and unset others
UPDATE user_wallets uw
SET is_primary = false
WHERE is_primary = true
AND uw.id NOT IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) as rn
    FROM user_wallets
    WHERE is_primary = true
  ) ranked
  WHERE rn = 1
);

-- For users with zero primary wallets, set oldest as primary
UPDATE user_wallets uw
SET is_primary = true
WHERE uw.id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) as rn
    FROM user_wallets
    WHERE user_id IN (
      SELECT user_id FROM user_wallets
      GROUP BY user_id
      HAVING COUNT(CASE WHEN is_primary = true THEN 1 END) = 0
    )
  ) ranked
  WHERE rn = 1
);

-- =====================================================
-- STEP 4: Enable RLS and implement policies
-- =====================================================

-- Enable RLS on user_wallets table
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Users can only read their own wallets
DROP POLICY IF EXISTS p_user_wallets_select_own ON user_wallets;
CREATE POLICY p_user_wallets_select_own
  ON user_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: INSERT - Deny all (only Edge Functions via service role)
DROP POLICY IF EXISTS p_user_wallets_no_insert ON user_wallets;
CREATE POLICY p_user_wallets_no_insert
  ON user_wallets
  FOR INSERT
  WITH CHECK (false);

-- RLS Policy: UPDATE - Deny all (only Edge Functions via service role)
DROP POLICY IF EXISTS p_user_wallets_no_update ON user_wallets;
CREATE POLICY p_user_wallets_no_update
  ON user_wallets
  FOR UPDATE
  USING (false);

-- RLS Policy: DELETE - Deny all (only Edge Functions via service role)
DROP POLICY IF EXISTS p_user_wallets_no_delete ON user_wallets;
CREATE POLICY p_user_wallets_no_delete
  ON user_wallets
  FOR DELETE
  USING (false);

-- =====================================================
-- STEP 5: REVOKE write permissions from client roles
-- =====================================================

-- Revoke INSERT, UPDATE, DELETE from anon and authenticated roles
-- This ensures only service role (Edge Functions) can write
REVOKE INSERT, UPDATE, DELETE ON user_wallets FROM anon, authenticated;

-- Ensure SELECT is still allowed (via RLS policies)
GRANT SELECT ON user_wallets TO authenticated;

-- =====================================================
-- STEP 6: Performance indexes
-- =====================================================

-- Index for address_lc lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_address_lc 
ON user_wallets(address_lc);

-- Index for user + address_lc + chain_namespace lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_address_lc_chain_namespace 
ON user_wallets(user_id, address_lc, chain_namespace);

-- Index for is_primary lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_is_primary 
ON user_wallets(user_id, is_primary);

-- =====================================================
-- STEP 7: Validation constraints
-- =====================================================

-- Ensure address_lc is always lowercase (redundant but explicit)
ALTER TABLE user_wallets 
ADD CONSTRAINT IF NOT EXISTS address_lc_lowercase 
CHECK (address_lc = LOWER(address_lc));

-- =====================================================
-- STEP 8: Documentation
-- =====================================================

COMMENT ON COLUMN user_wallets.address_lc IS 'Lowercase address for case-insensitive lookups (generated column, STORED)';
COMMENT ON COLUMN user_wallets.is_primary IS 'Whether this wallet is the primary/default wallet for the user (unique per user)';

COMMENT ON INDEX uq_user_wallets_user_addr_chain IS 'Unique constraint: prevents duplicate (user_id, address_lc, chain_namespace) combinations';
COMMENT ON INDEX uq_user_wallets_primary_per_user IS 'Unique constraint: ensures only one primary wallet per user';

-- =====================================================
-- STEP 9: Verification and logging
-- =====================================================

DO $
DECLARE
  v_total_wallets INTEGER;
  v_primary_wallets INTEGER;
  v_users_with_multiple_primary INTEGER;
  v_users_with_zero_primary INTEGER;
  v_duplicate_addresses INTEGER;
BEGIN
  -- Count total wallets
  SELECT COUNT(*) INTO v_total_wallets FROM user_wallets;
  
  -- Count primary wallets
  SELECT COUNT(*) INTO v_primary_wallets FROM user_wallets WHERE is_primary = true;
  
  -- Check for users with multiple primary wallets (should be 0)
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_multiple_primary
  FROM (
    SELECT user_id, COUNT(*) as primary_count
    FROM user_wallets
    WHERE is_primary = true
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) t;

  -- Check for users with zero primary wallets (should be 0)
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_zero_primary
  FROM (
    SELECT user_id
    FROM user_wallets
    GROUP BY user_id
    HAVING COUNT(CASE WHEN is_primary = true THEN 1 END) = 0
  ) t;

  -- Check for duplicate (user_id, address_lc, chain_namespace) combinations
  SELECT COUNT(*) INTO v_duplicate_addresses
  FROM (
    SELECT user_id, address_lc, chain_namespace, COUNT(*) as cnt
    FROM user_wallets
    GROUP BY user_id, address_lc, chain_namespace
    HAVING COUNT(*) > 1
  ) t;

  RAISE NOTICE 'Multi-chain security migration completed:';
  RAISE NOTICE '  - Total wallets: %', v_total_wallets;
  RAISE NOTICE '  - Primary wallets: %', v_primary_wallets;
  RAISE NOTICE '  - Users with multiple primaries: % (should be 0)', v_users_with_multiple_primary;
  RAISE NOTICE '  - Users with zero primaries: % (should be 0)', v_users_with_zero_primary;
  RAISE NOTICE '  - Duplicate (user_id, address_lc, chain_namespace): % (should be 0)', v_duplicate_addresses;

  IF v_users_with_multiple_primary > 0 THEN
    RAISE WARNING 'Found % users with multiple primary wallets - constraint may not be enforced!', v_users_with_multiple_primary;
  END IF;

  IF v_users_with_zero_primary > 0 THEN
    RAISE WARNING 'Found % users with zero primary wallets - cleanup may have failed!', v_users_with_zero_primary;
  END IF;

  IF v_duplicate_addresses > 0 THEN
    RAISE WARNING 'Found % duplicate (user_id, address_lc, chain_namespace) combinations - constraint may not be enforced!', v_duplicate_addresses;
  END IF;
END;
$;

-- =====================================================
-- STEP 10: Idempotency verification
-- =====================================================

-- This migration is idempotent:
-- - All ALTER TABLE statements use IF NOT EXISTS
-- - All CREATE INDEX statements use IF NOT EXISTS
-- - All CREATE POLICY statements use DROP IF EXISTS first
-- - All REVOKE statements are safe to re-run
-- - Data cleanup is safe to re-run (idempotent UPDATE statements)
-- - Verification checks are informational only

-- Safe to re-run without side effects
