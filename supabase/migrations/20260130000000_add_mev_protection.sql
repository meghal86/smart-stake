-- ============================================================================
-- Add MEV Protection Support to Unified Portfolio System
-- Migration: 20260130000000_add_mev_protection.sql
-- 
-- This migration adds MEV (Maximal Extractable Value) protection configuration
-- to the portfolio system as part of V1.1 features.
--
-- Changes:
--   1. Update cockpit_state.prefs JSONB to include mev_protected_mode
--   2. Add audit event types for MEV protection usage
--   3. Add execution_steps columns for MEV protection tracking
--
-- Requirements: R14.3 (MEV-protected sending toggle)
-- ============================================================================

-- ============================================================================
-- 1. UPDATE COCKPIT_STATE PREFS DOCUMENTATION
-- ============================================================================

-- Update comment to document MEV protection mode in portfolio_policy
COMMENT ON COLUMN cockpit_state.prefs IS 'JSONB preferences: wallet_scope_default, timezone (IANA), dnd_start_local, dnd_end_local, notif_cap_per_day, portfolio_policy (max_gas_usd, block_new_contracts_days, block_infinite_approvals_to_unknown, require_simulation_for_value_over_usd, confidence_threshold, mev_protected_mode: "off"|"auto"|"force")';

-- ============================================================================
-- 2. ADD MEV PROTECTION TRACKING TO EXECUTION_STEPS
-- ============================================================================

-- Add columns to track MEV protection usage per execution step
ALTER TABLE execution_steps 
ADD COLUMN IF NOT EXISTS mev_protection_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mev_protection_provider TEXT,
ADD COLUMN IF NOT EXISTS mev_protection_mode TEXT CHECK (mev_protection_mode IN ('off', 'auto', 'force'));

-- Add index for MEV protection queries
CREATE INDEX IF NOT EXISTS idx_execution_steps_mev_protection ON execution_steps (mev_protection_used, mev_protection_provider);

-- Add comment for documentation
COMMENT ON COLUMN execution_steps.mev_protection_used IS 'Whether MEV protection was used for this execution step';
COMMENT ON COLUMN execution_steps.mev_protection_provider IS 'MEV protection provider used (e.g., flashbots, eden, bloxroute)';
COMMENT ON COLUMN execution_steps.mev_protection_mode IS 'MEV protection mode at time of execution (off, auto, force)';

-- ============================================================================
-- 3. ADD MEV PROTECTION AUDIT EVENT TYPES
-- ============================================================================

-- Add check constraint to audit_events.event_type to include MEV-related events
-- Note: We don't enforce a strict enum here to allow flexibility, but document expected types

COMMENT ON COLUMN audit_events.event_type IS 'Event type: payload_mismatch_block, policy_block, simulation_failover, override_unsafe, mev_mode_used, mev_mode_forced, mev_mode_unavailable, cross_wallet_guard, etc.';

-- ============================================================================
-- 4. HELPER FUNCTION TO GET MEV PROTECTION STATUS
-- ============================================================================

-- Function to check if MEV protection is supported on a chain
CREATE OR REPLACE FUNCTION is_mev_supported_chain(chain_id_param INTEGER) RETURNS BOOLEAN AS $
BEGIN
  -- Currently supported chains: Ethereum Mainnet (1), Goerli (5), Sepolia (11155111)
  RETURN chain_id_param IN (1, 5, 11155111);
END;
$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_mev_supported_chain(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_mev_supported_chain(INTEGER) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION is_mev_supported_chain(INTEGER) IS 'Check if a chain supports MEV protection (Flashbots, Eden, etc.)';

-- ============================================================================
-- 5. DEFAULT MEV PROTECTION MODE FOR EXISTING USERS
-- ============================================================================

-- Update existing cockpit_state records to include default MEV protection mode
-- This ensures backward compatibility for users who already have preferences
UPDATE cockpit_state
SET prefs = jsonb_set(
  COALESCE(prefs, '{}'::jsonb),
  '{portfolio_policy,mev_protected_mode}',
  '"auto"'::jsonb,
  true
)
WHERE prefs IS NULL 
   OR NOT (prefs ? 'portfolio_policy')
   OR NOT (prefs->'portfolio_policy' ? 'mev_protected_mode');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add migration metadata
COMMENT ON FUNCTION is_mev_supported_chain IS 'V1.1 Feature: MEV protection support check for unified portfolio system';
