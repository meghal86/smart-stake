-- =====================================================
-- Multi-Chain EVM Wallet Enhancement Migration
-- Extends existing user_wallets table for CAIP-2 support
-- =====================================================

-- Add multi-chain columns to existing user_wallets table
-- DO NOT recreate the table - extend it to preserve existing data

-- Add chain_namespace column with CAIP-2 format support
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS chain_namespace TEXT DEFAULT 'eip155:1';

-- Add network metadata for RPC URLs, explorers, etc.
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS network_metadata JSONB DEFAULT '{}'::jsonb;

-- Add balance cache for offline viewing
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS balance_cache JSONB DEFAULT '{}'::jsonb;

-- Add Guardian scores per network
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS guardian_scores JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- Data Migration: Convert existing chain values to CAIP-2
-- =====================================================

-- Update existing records to use CAIP-2 format
-- Only update records that still have the default 'eip155:1' value
UPDATE user_wallets 
SET chain_namespace = CASE 
  WHEN chain = 'ethereum' THEN 'eip155:1'
  WHEN chain = 'polygon' THEN 'eip155:137'
  WHEN chain = 'arbitrum' THEN 'eip155:42161'
  WHEN chain = 'optimism' THEN 'eip155:10'
  WHEN chain = 'base' THEN 'eip155:8453'
  WHEN chain = 'bsc' THEN 'eip155:56'
  WHEN chain = 'avalanche' THEN 'eip155:43114'
  WHEN chain = 'fantom' THEN 'eip155:250'
  ELSE 'eip155:1'  -- Default to Ethereum mainnet
END
WHERE chain_namespace = 'eip155:1';  -- Only update default values

-- =====================================================
-- Performance Indexes
-- =====================================================

-- Add index for CAIP-2 chain_namespace lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_chain_namespace 
ON user_wallets(chain_namespace);

-- Add composite index for user + chain_namespace queries
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_chain_namespace 
ON user_wallets(user_id, chain_namespace);

-- Add index for balance cache queries
CREATE INDEX IF NOT EXISTS idx_user_wallets_balance_cache 
ON user_wallets USING GIN(balance_cache);

-- Add index for Guardian scores queries
CREATE INDEX IF NOT EXISTS idx_user_wallets_guardian_scores 
ON user_wallets USING GIN(guardian_scores);

-- =====================================================
-- Validation Constraints
-- =====================================================

-- Add constraint for valid CAIP-2 format (eip155:chainId)
ALTER TABLE user_wallets 
ADD CONSTRAINT IF NOT EXISTS valid_chain_namespace 
CHECK (chain_namespace ~ '^eip155:[0-9]+$');

-- Add constraint for supported EVM networks (v2.3 scope)
ALTER TABLE user_wallets 
ADD CONSTRAINT IF NOT EXISTS supported_evm_networks 
CHECK (chain_namespace IN (
  'eip155:1',     -- Ethereum Mainnet
  'eip155:137',   -- Polygon
  'eip155:42161', -- Arbitrum One
  'eip155:10',    -- Optimism
  'eip155:8453',  -- Base
  'eip155:56',    -- BSC (for existing data)
  'eip155:43114', -- Avalanche (for existing data)
  'eip155:250'    -- Fantom (for existing data)
));

-- =====================================================
-- Update Unique Constraint for Multi-Chain
-- =====================================================

-- Drop old unique constraint and create new one with chain_namespace
ALTER TABLE user_wallets 
DROP CONSTRAINT IF EXISTS user_wallets_user_id_address_chain_key;

-- Add new unique constraint using chain_namespace
ALTER TABLE user_wallets 
ADD CONSTRAINT IF NOT EXISTS user_wallets_user_id_address_chain_namespace_key 
UNIQUE(user_id, address, chain_namespace);

-- =====================================================
-- Enhanced Helper Functions
-- =====================================================

-- Function: Get wallets by chain namespace
CREATE OR REPLACE FUNCTION get_user_wallets_by_network(
  p_user_id UUID,
  p_chain_namespace TEXT
)
RETURNS TABLE (
  id UUID,
  address TEXT,
  label TEXT,
  chain TEXT,
  chain_namespace TEXT,
  source TEXT,
  verified BOOLEAN,
  last_scan TIMESTAMPTZ,
  trust_score INTEGER,
  risk_flags JSONB,
  network_metadata JSONB,
  balance_cache JSONB,
  guardian_scores JSONB,
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
    uw.label,
    uw.chain,
    uw.chain_namespace,
    uw.source,
    uw.verified,
    uw.last_scan,
    uw.trust_score,
    uw.risk_flags,
    uw.network_metadata,
    uw.balance_cache,
    uw.guardian_scores,
    uw.created_at
  FROM user_wallets uw
  WHERE uw.user_id = p_user_id 
    AND uw.chain_namespace = p_chain_namespace
  ORDER BY uw.created_at DESC;
END;
$;

-- Function: Update wallet network data
CREATE OR REPLACE FUNCTION update_wallet_network_data(
  p_wallet_id UUID,
  p_chain_namespace TEXT,
  p_network_metadata JSONB DEFAULT '{}'::jsonb,
  p_balance_cache JSONB DEFAULT '{}'::jsonb,
  p_guardian_scores JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
BEGIN
  UPDATE user_wallets
  SET 
    chain_namespace = p_chain_namespace,
    network_metadata = COALESCE(p_network_metadata, network_metadata),
    balance_cache = COALESCE(p_balance_cache, balance_cache),
    guardian_scores = COALESCE(p_guardian_scores, guardian_scores),
    updated_at = NOW()
  WHERE id = p_wallet_id;
END;
$;

-- Function: Enhanced upsert with CAIP-2 support
CREATE OR REPLACE FUNCTION upsert_user_wallet_multi_chain(
  p_user_id UUID,
  p_address TEXT,
  p_chain_namespace TEXT DEFAULT 'eip155:1',
  p_label TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_network_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
DECLARE
  v_wallet_id UUID;
  v_chain_name TEXT;
BEGIN
  -- Map chain_namespace to legacy chain name for backward compatibility
  v_chain_name := CASE p_chain_namespace
    WHEN 'eip155:1' THEN 'ethereum'
    WHEN 'eip155:137' THEN 'polygon'
    WHEN 'eip155:42161' THEN 'arbitrum'
    WHEN 'eip155:10' THEN 'optimism'
    WHEN 'eip155:8453' THEN 'base'
    WHEN 'eip155:56' THEN 'bsc'
    WHEN 'eip155:43114' THEN 'avalanche'
    WHEN 'eip155:250' THEN 'fantom'
    ELSE 'ethereum'
  END;

  INSERT INTO user_wallets (
    user_id,
    address,
    chain,
    chain_namespace,
    label,
    source,
    network_metadata
  ) VALUES (
    p_user_id,
    LOWER(p_address), -- normalize address to lowercase
    v_chain_name,
    p_chain_namespace,
    p_label,
    p_source,
    p_network_metadata
  )
  ON CONFLICT (user_id, address, chain_namespace) 
  DO UPDATE SET
    label = COALESCE(EXCLUDED.label, user_wallets.label),
    source = COALESCE(EXCLUDED.source, user_wallets.source),
    network_metadata = COALESCE(EXCLUDED.network_metadata, user_wallets.network_metadata),
    updated_at = NOW()
  RETURNING id INTO v_wallet_id;
  
  RETURN v_wallet_id;
END;
$;

-- =====================================================
-- Enhanced Views
-- =====================================================

-- View: Multi-chain wallet summary
CREATE OR REPLACE VIEW user_wallet_multi_chain_summary AS
SELECT 
  uw.id,
  uw.user_id,
  uw.address,
  uw.label,
  uw.chain,
  uw.chain_namespace,
  uw.source,
  uw.verified,
  uw.last_scan,
  uw.trust_score,
  uw.risk_flags,
  uw.network_metadata,
  uw.balance_cache,
  uw.guardian_scores,
  uw.created_at,
  uw.updated_at,
  COUNT(DISTINCT gr.id) as scan_count,
  MAX(gr.scanned_at) as latest_scan_at,
  -- Extract network-specific data
  (uw.guardian_scores->uw.chain_namespace)::integer as current_network_guardian_score,
  (uw.balance_cache->uw.chain_namespace) as current_network_balance
FROM user_wallets uw
LEFT JOIN guardian_results gr ON gr.wallet_address = uw.address AND gr.user_id = uw.user_id
GROUP BY uw.id;

-- Grant access to authenticated users
GRANT SELECT ON user_wallet_multi_chain_summary TO authenticated;

-- =====================================================
-- Grant permissions for new functions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_user_wallets_by_network TO authenticated;
GRANT EXECUTE ON FUNCTION update_wallet_network_data TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_wallet_multi_chain TO authenticated;

-- =====================================================
-- Migration Audit Log
-- =====================================================

-- Create audit table for migration tracking
CREATE TABLE IF NOT EXISTS migration_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  records_affected INTEGER,
  notes TEXT
);

-- Log this migration
INSERT INTO migration_audit (migration_name, records_affected, notes)
SELECT 
  'multi_chain_enhancement_v2_3',
  COUNT(*),
  'Added CAIP-2 chain_namespace support, migrated existing chain values, added multi-chain columns'
FROM user_wallets;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON COLUMN user_wallets.chain_namespace IS 'CAIP-2 format chain identifier (e.g., eip155:1 for Ethereum mainnet)';
COMMENT ON COLUMN user_wallets.network_metadata IS 'Network-specific data: RPC URLs, block explorers, native currency info';
COMMENT ON COLUMN user_wallets.balance_cache IS 'Cached token balances per network for offline viewing';
COMMENT ON COLUMN user_wallets.guardian_scores IS 'Guardian trust scores per network (chain_namespace -> score)';

COMMENT ON FUNCTION get_user_wallets_by_network IS 'Get all user wallets for a specific CAIP-2 network';
COMMENT ON FUNCTION update_wallet_network_data IS 'Update network-specific data for a wallet';
COMMENT ON FUNCTION upsert_user_wallet_multi_chain IS 'Add or update wallet with CAIP-2 chain namespace support';

-- =====================================================
-- Verification Queries (for testing)
-- =====================================================

-- Verify migration completed successfully
DO $
DECLARE
  v_total_wallets INTEGER;
  v_migrated_wallets INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_wallets FROM user_wallets;
  SELECT COUNT(*) INTO v_migrated_wallets FROM user_wallets WHERE chain_namespace != 'eip155:1' OR chain = 'ethereum';
  
  RAISE NOTICE 'Migration completed: % total wallets, % have valid chain_namespace', v_total_wallets, v_migrated_wallets;
  
  -- Verify constraints are working
  IF EXISTS (SELECT 1 FROM user_wallets WHERE chain_namespace !~ '^eip155:[0-9]+$') THEN
    RAISE EXCEPTION 'Invalid chain_namespace format found after migration';
  END IF;
  
  RAISE NOTICE 'All validation constraints passed';
END;
$;