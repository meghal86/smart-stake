-- =====================================================
-- Primary Wallet Support Migration
-- Adds is_primary column and address_lc for case-insensitive lookups
-- =====================================================

-- Add is_primary column if it doesn't exist
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Add address_lc generated column for case-insensitive lookups
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS address_lc TEXT GENERATED ALWAYS AS (LOWER(address)) STORED;

-- =====================================================
-- Constraints for Primary Wallet Uniqueness
-- =====================================================

-- Add unique constraint: only one primary wallet per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wallets_primary_per_user 
ON user_wallets(user_id) WHERE is_primary = true;

-- Add unique constraint for (user_id, address_lc, chain_namespace)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wallets_user_address_lc_chain 
ON user_wallets(user_id, address_lc, chain_namespace);

-- =====================================================
-- Data Migration: Set first wallet as primary for each user
-- =====================================================

-- For each user, set their oldest wallet as primary (if none is already primary)
UPDATE user_wallets uw
SET is_primary = true
WHERE uw.id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) as rn
    FROM user_wallets
    WHERE is_primary = false
  ) ranked
  WHERE rn = 1
)
AND NOT EXISTS (
  SELECT 1 FROM user_wallets uw2 
  WHERE uw2.user_id = uw.user_id AND uw2.is_primary = true
);

-- =====================================================
-- Performance Indexes
-- =====================================================

-- Index for address_lc lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_address_lc 
ON user_wallets(address_lc);

-- Index for user + address_lc + chain_namespace lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_address_lc_chain_namespace 
ON user_wallets(user_id, address_lc, chain_namespace);

-- =====================================================
-- Validation Constraints
-- =====================================================

-- Ensure address_lc is always lowercase (redundant but explicit)
ALTER TABLE user_wallets 
ADD CONSTRAINT IF NOT EXISTS address_lc_lowercase 
CHECK (address_lc = LOWER(address_lc));

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Set wallet as primary (atomic operation)
CREATE OR REPLACE FUNCTION set_wallet_primary(
  p_wallet_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
DECLARE
  v_address TEXT;
  v_chain_namespace TEXT;
BEGIN
  -- Get the wallet's address and chain_namespace
  SELECT address, chain_namespace INTO v_address, v_chain_namespace
  FROM user_wallets
  WHERE id = p_wallet_id AND user_id = p_user_id;

  IF v_address IS NULL THEN
    RETURN false;
  END IF;

  -- Start transaction: unset all other primaries for this user, set this one as primary
  UPDATE user_wallets
  SET is_primary = false
  WHERE user_id = p_user_id AND is_primary = true;

  UPDATE user_wallets
  SET is_primary = true
  WHERE id = p_wallet_id AND user_id = p_user_id;

  RETURN true;
END;
$;

-- Function: Get primary wallet for user
CREATE OR REPLACE FUNCTION get_primary_wallet(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  address TEXT,
  chain_namespace TEXT,
  label TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.address,
    uw.chain_namespace,
    uw.label,
    uw.created_at
  FROM user_wallets uw
  WHERE uw.user_id = p_user_id AND uw.is_primary = true
  LIMIT 1;
END;
$;

-- Function: Get all wallets for user with primary indicator
CREATE OR REPLACE FUNCTION get_user_wallets_with_primary(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  address TEXT,
  address_lc TEXT,
  chain_namespace TEXT,
  label TEXT,
  is_primary BOOLEAN,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.address,
    uw.address_lc,
    uw.chain_namespace,
    uw.label,
    uw.is_primary,
    uw.created_at
  FROM user_wallets uw
  WHERE uw.user_id = p_user_id
  ORDER BY uw.is_primary DESC, uw.created_at DESC, uw.id ASC;
END;
$;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION set_wallet_primary TO authenticated;
GRANT EXECUTE ON FUNCTION get_primary_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wallets_with_primary TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON COLUMN user_wallets.is_primary IS 'Whether this wallet is the primary/default wallet for the user';
COMMENT ON COLUMN user_wallets.address_lc IS 'Lowercase address for case-insensitive lookups (generated column)';

COMMENT ON FUNCTION set_wallet_primary IS 'Atomically set a wallet as primary (unsets all others for user)';
COMMENT ON FUNCTION get_primary_wallet IS 'Get the primary wallet for a user';
COMMENT ON FUNCTION get_user_wallets_with_primary IS 'Get all wallets for a user with primary indicator, ordered deterministically';

-- =====================================================
-- Verification
-- =====================================================

DO $
DECLARE
  v_total_wallets INTEGER;
  v_primary_wallets INTEGER;
  v_users_with_multiple_primary INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_wallets FROM user_wallets;
  SELECT COUNT(*) INTO v_primary_wallets FROM user_wallets WHERE is_primary = true;
  
  SELECT COUNT(DISTINCT user_id) INTO v_users_with_multiple_primary
  FROM (
    SELECT user_id, COUNT(*) as primary_count
    FROM user_wallets
    WHERE is_primary = true
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) t;

  RAISE NOTICE 'Primary wallet migration completed: % total wallets, % primary wallets, % users with multiple primaries',
    v_total_wallets, v_primary_wallets, v_users_with_multiple_primary;

  IF v_users_with_multiple_primary > 0 THEN
    RAISE WARNING 'Found % users with multiple primary wallets - this should not happen!', v_users_with_multiple_primary;
  END IF;
END;
$;
