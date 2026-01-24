-- ============================================================================
-- Unified Portfolio System Database Schema
-- Migration: 20260123000001_unified_portfolio_schema.sql
-- 
-- This migration creates the database schema for the Unified Portfolio System
-- following the reuse-first architecture principle.
--
-- Tables created:
--   1. portfolio_snapshots - Portfolio aggregation with upsert-current mode
--   2. approval_risks - Token approval risk scoring
--   3. intent_plans - Multi-step transaction plans
--   4. execution_steps - Individual execution steps with state tracking
--   5. simulation_receipts - Transaction simulation results with expiry
--   6. audit_events - Audit trail for portfolio operations
--   7. notification_prefs - User notification preferences
--   8. notification_events - Notification events
--   9. notification_deliveries - Notification delivery tracking
--
-- Extensions to existing tables:
--   - user_wallets: Add address_hash and address_enc for privacy
--   - cockpit_state: Extend prefs for portfolio policy configuration
--
-- Requirements: 1.1, 7.5, 7.6, 8.4, 11.4, 14.4, 15.8, 15.9, R8.6, R12.7
-- ============================================================================

-- ============================================================================
-- 1. EXTEND EXISTING TABLES (REUSE-FIRST)
-- ============================================================================

-- Extend user_wallets table for portfolio address management (R12.5-R12.7)
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS address_hash TEXT,
ADD COLUMN IF NOT EXISTS address_enc TEXT;

-- Add normalization trigger for user_wallets addresses
CREATE OR REPLACE FUNCTION normalize_user_wallet_address()
RETURNS TRIGGER AS $
BEGIN
  -- Normalize address to lowercase
  NEW.address = lower(NEW.address);
  
  -- Generate address_hash for indexing (required for privacy)
  NEW.address_hash = encode(sha256(NEW.address::bytea), 'hex');
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_user_wallet_address
  BEFORE INSERT OR UPDATE ON user_wallets
  FOR EACH ROW EXECUTE FUNCTION normalize_user_wallet_address();

-- Add index on address_hash for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_address_hash ON user_wallets(address_hash);

-- Add constraint to ensure address_hash is present and address is normalized
ALTER TABLE user_wallets 
ADD CONSTRAINT chk_user_wallets_address_normalized 
CHECK (address_hash IS NOT NULL AND address = lower(address));

-- ============================================================================
-- 2. PORTFOLIO_SNAPSHOTS TABLE (R15.9 - upsert-current mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT, -- nullable if scope_mode = all_wallets
  scope_mode TEXT NOT NULL DEFAULT 'active_wallet' CHECK (scope_mode IN ('active_wallet','all_wallets')),
  scope_key TEXT NOT NULL, -- deterministic key for upsert behavior
  net_worth DECIMAL(20,8) NOT NULL,
  delta_24h DECIMAL(20,8) NOT NULL,
  freshness_sec INTEGER NOT NULL,
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0.0000 AND confidence <= 1.0000), -- R15.8
  risk_score NUMERIC(5,4) NOT NULL CHECK (risk_score >= 0.0000 AND risk_score <= 1.0000), -- R15.8
  positions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- R15.9: Unique constraint for upsert-current behavior
  UNIQUE (user_id, scope_mode, scope_key)
);

-- Normalization trigger for portfolio_snapshots
CREATE OR REPLACE FUNCTION normalize_portfolio_snapshot()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address = lower(NEW.wallet_address);
  END IF;
  
  -- Auto-set scope_key to prevent app code errors
  IF NEW.scope_mode = 'active_wallet' THEN
    NEW.scope_key = lower(NEW.wallet_address);
  ELSIF NEW.scope_mode = 'all_wallets' THEN
    NEW.scope_key = NEW.user_id::text;
    NEW.wallet_address = NULL;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_norm_portfolio_snapshots
  BEFORE INSERT OR UPDATE ON portfolio_snapshots
  FOR EACH ROW EXECUTE FUNCTION normalize_portfolio_snapshot();

-- Indexes for portfolio_snapshots
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_scope ON portfolio_snapshots (user_id, scope_mode, scope_key);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_freshness ON portfolio_snapshots (freshness_sec);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_confidence ON portfolio_snapshots (confidence);
-- R15.9: Latest snapshot index for upsert-current queries
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_latest ON portfolio_snapshots (user_id, scope_mode, scope_key, updated_at DESC);

-- Scope key validation constraint
ALTER TABLE portfolio_snapshots 
ADD CONSTRAINT chk_scope_key_rules 
CHECK (
  (scope_mode='active_wallet' AND wallet_address IS NOT NULL AND scope_key = lower(wallet_address))
  OR
  (scope_mode='all_wallets' AND wallet_address IS NULL AND scope_key = user_id::text)
);

-- Enable RLS
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_snapshots_rw_own" ON portfolio_snapshots 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. APPROVAL_RISKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL, -- EIP-155 chain ID, no DEFAULT
  token_address TEXT NOT NULL,
  spender_address TEXT NOT NULL,
  amount TEXT NOT NULL, -- "unlimited" or specific amount
  risk_score NUMERIC(5,4) NOT NULL CHECK (risk_score >= 0.0000 AND risk_score <= 1.0000), -- R15.8
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  value_at_risk_usd DECIMAL(20,8) NOT NULL,
  risk_reasons TEXT[] NOT NULL,
  contributing_factors JSONB NOT NULL,
  age_days INTEGER NOT NULL,
  is_permit2 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalization trigger for approval_risks
CREATE OR REPLACE FUNCTION normalize_approval_risk_addresses()
RETURNS TRIGGER AS $
BEGIN
  NEW.wallet_address = lower(NEW.wallet_address);
  NEW.token_address = lower(NEW.token_address);
  NEW.spender_address = lower(NEW.spender_address);
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_norm_approval_risks
  BEFORE INSERT OR UPDATE ON approval_risks
  FOR EACH ROW EXECUTE FUNCTION normalize_approval_risk_addresses();

-- Indexes for approval_risks
CREATE INDEX IF NOT EXISTS idx_approval_risks_user_chain_sev ON approval_risks (user_id, chain_id, severity);
CREATE INDEX IF NOT EXISTS idx_approval_risks_risk_score ON approval_risks (risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_approval_risks_permit2 ON approval_risks (is_permit2);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_approval_risks_identity ON approval_risks (user_id, wallet_address, chain_id, token_address, spender_address);

-- Enable RLS
ALTER TABLE approval_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_risks_rw_own" ON approval_risks 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. INTENT_PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS intent_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  wallet_scope JSONB NOT NULL,
  steps JSONB NOT NULL,
  policy_status TEXT NOT NULL CHECK (policy_status IN ('allowed', 'blocked')),
  policy_violations TEXT[],
  simulation_status TEXT NOT NULL CHECK (simulation_status IN ('pass', 'warn', 'block')),
  simulation_receipt_id TEXT,
  impact_preview JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet scope JSON validation constraint
ALTER TABLE intent_plans ADD CONSTRAINT chk_wallet_scope_shape CHECK (
  (wallet_scope->>'mode' = 'active_wallet' AND (wallet_scope ? 'address'))
  OR
  (wallet_scope->>'mode' = 'all_wallets' AND NOT (wallet_scope ? 'address'))
);

-- Immutability trigger for intent_plans.steps
CREATE OR REPLACE FUNCTION prevent_steps_modification()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.steps IS DISTINCT FROM NEW.steps THEN
    RAISE EXCEPTION 'intent_plans.steps is immutable after creation';
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_steps_modification
  BEFORE UPDATE ON intent_plans
  FOR EACH ROW EXECUTE FUNCTION prevent_steps_modification();

-- Indexes for intent_plans
CREATE UNIQUE INDEX IF NOT EXISTS uniq_intent_plans_user_idempotency ON intent_plans (user_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_intent_plans_user_status ON intent_plans (user_id, status);
CREATE INDEX IF NOT EXISTS idx_intent_plans_simulation ON intent_plans (simulation_status);

-- Enable RLS
ALTER TABLE intent_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intent_plans_rw_own" ON intent_plans 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. EXECUTION_STEPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES intent_plans(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  chain_id INTEGER NOT NULL, -- EIP-155 chain ID
  target_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed')),
  payload TEXT,
  gas_estimate INTEGER,
  error_message TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  step_idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for execution_steps
CREATE UNIQUE INDEX IF NOT EXISTS uniq_execution_steps_plan_step ON execution_steps (plan_id, step_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_execution_steps_plan_step_idem ON execution_steps (plan_id, step_idempotency_key);
CREATE INDEX IF NOT EXISTS idx_execution_steps_plan_status ON execution_steps (plan_id, status);
CREATE INDEX IF NOT EXISTS idx_execution_steps_tx_hash ON execution_steps (transaction_hash);

-- Enable RLS (via plan ownership)
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "execution_steps_rw_via_plan" ON execution_steps 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM intent_plans 
    WHERE intent_plans.id = execution_steps.plan_id 
    AND intent_plans.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM intent_plans 
    WHERE intent_plans.id = execution_steps.plan_id 
    AND intent_plans.user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. SIMULATION_RECEIPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulation_receipts (
  id TEXT PRIMARY KEY, -- receipt id
  plan_id UUID NOT NULL REFERENCES intent_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_scope_hash TEXT NOT NULL,
  chain_set_hash TEXT NOT NULL,
  simulator_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  -- Receipt sanity constraints
  CONSTRAINT chk_receipt_expires_after_created CHECK (expires_at > created_at)
);

-- Indexes for simulation_receipts
CREATE INDEX IF NOT EXISTS idx_sim_receipts_plan ON simulation_receipts (plan_id);
CREATE INDEX IF NOT EXISTS idx_sim_receipts_expires ON simulation_receipts (expires_at);

-- Enable RLS
ALTER TABLE simulation_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sim_receipts_rw_own" ON simulation_receipts 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. AUDIT_EVENTS TABLE (R8.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_scope JSONB NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  plan_id UUID REFERENCES intent_plans(id) ON DELETE SET NULL,
  step_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_events
CREATE INDEX IF NOT EXISTS idx_audit_events_user_created ON audit_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_plan ON audit_events (plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events (severity);

-- Enable RLS
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_events_rw_own" ON audit_events 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 8. NOTIFICATION SYSTEM TABLES (R11)
-- ============================================================================

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dnd BOOLEAN NOT NULL DEFAULT FALSE,
  caps INTEGER NOT NULL DEFAULT 10 CHECK (caps >= 0 AND caps <= 50),
  severity_threshold TEXT NOT NULL DEFAULT 'medium' CHECK (severity_threshold IN ('critical', 'high', 'medium', 'low')),
  channels JSONB NOT NULL DEFAULT '["email"]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_prefs_rw_own" ON notification_prefs 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification events table
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  scope_key TEXT NOT NULL,
  deep_link TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification_events
CREATE INDEX IF NOT EXISTS idx_notification_events_user_created ON notification_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_severity ON notification_events (severity);

-- Enable RLS
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_events_rw_own" ON notification_events 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification deliveries table
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification_deliveries
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_event ON notification_deliveries (event_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries (status);

-- Enable RLS (via event ownership)
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_deliveries_rw_via_event" ON notification_deliveries 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM notification_events 
    WHERE notification_events.id = notification_deliveries.event_id 
    AND notification_events.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM notification_events 
    WHERE notification_events.id = notification_deliveries.event_id 
    AND notification_events.user_id = auth.uid()
  )
);

-- ============================================================================
-- 9. EXTEND COCKPIT_STATE FOR PORTFOLIO POLICY PREFERENCES (R12.7)
-- ============================================================================

-- Add portfolio policy preferences to existing cockpit_state.prefs JSONB
-- This extends the existing structure rather than creating a new table
COMMENT ON COLUMN cockpit_state.prefs IS 'JSONB preferences: wallet_scope_default, timezone (IANA), dnd_start_local, dnd_end_local, notif_cap_per_day, portfolio_policy (max_gas_usd, block_new_contracts_days, block_infinite_approvals_to_unknown, require_simulation_for_value_over_usd, confidence_threshold)';

-- ============================================================================
-- 10. CLEANUP FUNCTIONS (R8.6)
-- ============================================================================

-- Function to delete expired simulation receipts
CREATE OR REPLACE FUNCTION cleanup_expired_simulation_receipts() RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM simulation_receipts
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to keep last N snapshots per scope
CREATE OR REPLACE FUNCTION cleanup_old_portfolio_snapshots(keep_count INTEGER DEFAULT 10) RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old snapshots, keeping the most recent N per (user_id, scope_mode, scope_key)
  WITH ranked_snapshots AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, scope_mode, scope_key 
             ORDER BY updated_at DESC
           ) as rn
    FROM portfolio_snapshots
  )
  DELETE FROM portfolio_snapshots
  WHERE id IN (
    SELECT id FROM ranked_snapshots WHERE rn > keep_count
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role for scheduled jobs
GRANT EXECUTE ON FUNCTION cleanup_expired_simulation_receipts() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_portfolio_snapshots(INTEGER) TO service_role;

-- ============================================================================
-- 11. UPDATED_AT TRIGGERS
-- ============================================================================

-- Updated_at trigger for portfolio_snapshots
CREATE OR REPLACE FUNCTION update_portfolio_snapshots_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_snapshots_updated_at
  BEFORE UPDATE ON portfolio_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_snapshots_updated_at();

-- Updated_at trigger for approval_risks
CREATE OR REPLACE FUNCTION update_approval_risks_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER approval_risks_updated_at
  BEFORE UPDATE ON approval_risks
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_risks_updated_at();

-- Updated_at trigger for intent_plans
CREATE OR REPLACE FUNCTION update_intent_plans_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER intent_plans_updated_at
  BEFORE UPDATE ON intent_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_intent_plans_updated_at();

-- Updated_at trigger for execution_steps
CREATE OR REPLACE FUNCTION update_execution_steps_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER execution_steps_updated_at
  BEFORE UPDATE ON execution_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_execution_steps_updated_at();

-- Updated_at trigger for notification_prefs
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON notification_prefs
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

-- ============================================================================
-- 12. GRANTS
-- ============================================================================

-- Grant table access to authenticated users (RLS will enforce row-level access)
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON approval_risks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON intent_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON execution_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON simulation_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_prefs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_deliveries TO authenticated;

-- Grant table access to service role (for admin operations and cleanup jobs)
GRANT ALL ON portfolio_snapshots TO service_role;
GRANT ALL ON approval_risks TO service_role;
GRANT ALL ON intent_plans TO service_role;
GRANT ALL ON execution_steps TO service_role;
GRANT ALL ON simulation_receipts TO service_role;
GRANT ALL ON audit_events TO service_role;
GRANT ALL ON notification_prefs TO service_role;
GRANT ALL ON notification_events TO service_role;
GRANT ALL ON notification_deliveries TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE portfolio_snapshots IS 'Portfolio aggregation snapshots with upsert-current mode for unified portfolio system';
COMMENT ON TABLE approval_risks IS 'Token approval risk scoring and analysis';
COMMENT ON TABLE intent_plans IS 'Multi-step transaction plans with policy and simulation validation';
COMMENT ON TABLE execution_steps IS 'Individual execution steps with state tracking and idempotency';
COMMENT ON TABLE simulation_receipts IS 'Transaction simulation results with expiry for TOCTOU protection';
COMMENT ON TABLE audit_events IS 'Audit trail for portfolio operations and security events';
COMMENT ON TABLE notification_prefs IS 'User notification preferences for portfolio alerts';
COMMENT ON TABLE notification_events IS 'Portfolio notification events';
COMMENT ON TABLE notification_deliveries IS 'Notification delivery tracking and status';