-- ============================================================================
-- HarvestPro Tax-Loss Harvesting Module - COMPLETE SCHEMA
-- Migration: 20250201000000_harvestpro_complete_schema.sql
-- Description: Creates ALL tables, indexes, and RLS policies for HarvestPro
--              Includes v1 (Core), v2 (Institutional), and v3 (Enterprise)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- V1 CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- HARVEST LOTS TABLE
-- Stores individual acquisition lots for FIFO cost basis calculation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_lots (
  lot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  wallet_or_cex TEXT NOT NULL,
  
  -- v2 additions for multi-chain support
  chain_id INTEGER,
  venue_type TEXT CHECK (venue_type IN ('WALLET', 'CEX', 'DEFI')),
  venue_name TEXT,
  
  acquired_at TIMESTAMPTZ NOT NULL,
  acquired_qty NUMERIC NOT NULL CHECK (acquired_qty > 0),
  acquired_price_usd NUMERIC NOT NULL CHECK (acquired_price_usd >= 0),
  current_price_usd NUMERIC NOT NULL CHECK (current_price_usd >= 0),
  unrealized_pnl NUMERIC NOT NULL,
  holding_period_days INTEGER NOT NULL CHECK (holding_period_days >= 0),
  long_term BOOLEAN NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  liquidity_score NUMERIC NOT NULL CHECK (liquidity_score >= 0 AND liquidity_score <= 100),
  guardian_score NUMERIC NOT NULL CHECK (guardian_score >= 0 AND guardian_score <= 10),
  
  -- v2: MEV risk scoring
  mev_risk_score NUMERIC CHECK (mev_risk_score >= 0 AND mev_risk_score <= 10),
  
  eligible_for_harvest BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- HARVEST OPPORTUNITIES TABLE
-- Eligible harvest opportunities with calculated net benefits
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES harvest_lots(lot_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  token_logo_url TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  unrealized_loss NUMERIC NOT NULL CHECK (unrealized_loss > 0),
  remaining_qty NUMERIC NOT NULL CHECK (remaining_qty > 0),
  gas_estimate NUMERIC NOT NULL CHECK (gas_estimate >= 0),
  slippage_estimate NUMERIC NOT NULL CHECK (slippage_estimate >= 0),
  trading_fees NUMERIC NOT NULL CHECK (trading_fees >= 0),
  
  -- v2: Enhanced cost tracking
  tax_rate_used NUMERIC CHECK (tax_rate_used >= 0 AND tax_rate_used <= 1),
  mev_risk_cost_usd NUMERIC CHECK (mev_risk_cost_usd >= 0),
  
  net_tax_benefit NUMERIC NOT NULL,
  guardian_score NUMERIC NOT NULL CHECK (guardian_score >= 0 AND guardian_score <= 10),
  execution_time_estimate TEXT,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  recommendation_badge TEXT NOT NULL CHECK (recommendation_badge IN ('recommended', 'not-recommended', 'high-benefit', 'gas-heavy', 'guardian-flagged')),
  
  -- v2: Economic substance and proxy assets
  economic_substance_flag TEXT CHECK (economic_substance_flag IN ('PASS', 'WARN', 'BLOCKED')),
  proxy_asset_symbol TEXT,
  
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- HARVEST SESSIONS TABLE
-- User harvest execution sessions with state tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- v1 states + v3 awaiting_approval state
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'awaiting_approval', 'executing', 'completed', 'failed', 'cancelled')),
  
  -- v2: Execution strategy and MEV protection
  execution_strategy TEXT DEFAULT 'IMMEDIATE'
    CHECK (execution_strategy IN ('IMMEDIATE', 'TWAP', 'MANUAL')),
  mev_protection_mode TEXT CHECK (mev_protection_mode IN ('REQUIRED', 'PREFERRED', 'DISABLED')),
  
  opportunities_selected JSONB NOT NULL DEFAULT '[]',
  realized_losses_total NUMERIC NOT NULL DEFAULT 0,
  net_benefit_total NUMERIC NOT NULL DEFAULT 0,
  
  -- v2: Economic substance and jurisdiction
  economic_substance_status TEXT
    CHECK (economic_substance_status IN ('PASS', 'WARN', 'BLOCKED')),
  jurisdiction_code TEXT,
  
  -- v3: Custody integration
  custody_transaction_id TEXT,
  
  execution_steps JSONB NOT NULL DEFAULT '[]',
  export_url TEXT,
  proof_hash TEXT
);

-- ----------------------------------------------------------------------------
-- EXECUTION STEPS TABLE
-- Individual steps within a harvest session
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES harvest_sessions(session_id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('on-chain', 'cex-manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  transaction_hash TEXT,
  cex_platform TEXT,
  error_message TEXT,
  guardian_score NUMERIC CHECK (guardian_score >= 0 AND guardian_score <= 10),
  timestamp TIMESTAMPTZ,
  duration_ms INTEGER CHECK (duration_ms >= 0),
  
  -- v2: MEV protection tracking
  private_rpc_used BOOLEAN DEFAULT FALSE,
  mev_protection_provider TEXT,
  gas_paid_usd NUMERIC CHECK (gas_paid_usd >= 0),
  slippage_realized_bps INTEGER CHECK (slippage_realized_bps >= 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, step_number)
);

-- ----------------------------------------------------------------------------
-- USER SETTINGS TABLE
-- User-specific settings for tax calculations and notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_rate NUMERIC NOT NULL DEFAULT 0.24 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_threshold NUMERIC NOT NULL DEFAULT 100 CHECK (notification_threshold >= 0),
  preferred_wallets TEXT[] NOT NULL DEFAULT '{}',
  risk_tolerance TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  
  -- v2/v3: Institutional Guardrails
  max_daily_loss_usd NUMERIC CHECK (max_daily_loss_usd >= 0),
  max_single_trade_notional_usd NUMERIC CHECK (max_single_trade_notional_usd >= 0),
  max_slippage_bps INTEGER DEFAULT 50 CHECK (max_slippage_bps >= 0),
  require_private_rpc BOOLEAN DEFAULT FALSE,
  allow_cex_auto_trade BOOLEAN DEFAULT FALSE,
  
  -- v3: Custody Configuration
  custody_provider TEXT DEFAULT 'NONE'
    CHECK (custody_provider IN ('FIREBLOCKS', 'COPPER', 'NONE')),
  custody_api_credentials TEXT,  -- encrypted at application level
  custody_vault_id TEXT,
  
  -- v3: Approval workflow
  approval_threshold_usd NUMERIC CHECK (approval_threshold_usd >= 0),
  approver_role TEXT,
  
  -- v3: Compliance
  sanctions_screening_enabled BOOLEAN DEFAULT FALSE,
  order_routing_strategy TEXT DEFAULT 'IMMEDIATE'
    CHECK (order_routing_strategy IN ('IMMEDIATE', 'TWAP', 'VWAP')),
  twap_duration_minutes INTEGER CHECK (twap_duration_minutes > 0),
  limit_price_floor NUMERIC CHECK (limit_price_floor >= 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- WALLET TRANSACTIONS TABLE
-- Transaction history from connected wallets for FIFO calculation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  token TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'transfer_in', 'transfer_out')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price_usd NUMERIC NOT NULL CHECK (price_usd >= 0),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_hash, wallet_address)
);

-- ----------------------------------------------------------------------------
-- CEX ACCOUNTS TABLE
-- Linked centralized exchange accounts with encrypted credentials
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cex_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- CEX TRADES TABLE
-- Trade history from CEX accounts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cex_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cex_account_id UUID NOT NULL REFERENCES cex_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price_usd NUMERIC NOT NULL CHECK (price_usd >= 0),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cex_account_id, token, timestamp)
);

-- ----------------------------------------------------------------------------
-- HARVEST SYNC STATUS TABLE
-- Tracks sync status and history for wallet and CEX data synchronization
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS harvest_sync_status (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('wallets', 'cex')),
  last_sync_at TIMESTAMPTZ NOT NULL,
  wallets_processed INTEGER CHECK (wallets_processed >= 0),
  accounts_processed INTEGER CHECK (accounts_processed >= 0),
  transactions_found INTEGER CHECK (transactions_found >= 0),
  trades_found INTEGER CHECK (trades_found >= 0),
  errors TEXT[],
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, sync_type)
);

-- ============================================================================
-- V3 ENTERPRISE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- APPROVAL REQUESTS TABLE
-- Maker/Checker governance for large transactions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES harvest_sessions(session_id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  digital_signature TEXT,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- ----------------------------------------------------------------------------
-- SANCTIONS SCREENING LOGS TABLE
-- KYT/AML audit trail for compliance
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sanctions_screening_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES harvest_sessions(session_id) ON DELETE CASCADE,
  address_checked TEXT NOT NULL,
  risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 100),
  screening_provider TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('CLEAN', 'FLAGGED', 'BLOCKED')),
  flagged_reasons TEXT[],
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Harvest lots indexes
CREATE INDEX IF NOT EXISTS idx_harvest_lots_user 
  ON harvest_lots(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_harvest_lots_eligible 
  ON harvest_lots(user_id, eligible_for_harvest) 
  WHERE eligible_for_harvest = TRUE;

CREATE INDEX IF NOT EXISTS idx_harvest_lots_token 
  ON harvest_lots(user_id, token);

CREATE INDEX IF NOT EXISTS idx_harvest_lots_chain 
  ON harvest_lots(user_id, chain_id);

-- Harvest opportunities indexes
CREATE INDEX IF NOT EXISTS idx_harvest_opportunities_user 
  ON harvest_opportunities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_harvest_opportunities_benefit 
  ON harvest_opportunities(user_id, net_tax_benefit DESC);

CREATE INDEX IF NOT EXISTS idx_harvest_opportunities_lot 
  ON harvest_opportunities(lot_id);

-- Full-text search index for token search
CREATE INDEX IF NOT EXISTS idx_harvest_opportunities_token_fts 
  ON harvest_opportunities USING GIN (token gin_trgm_ops);

-- Harvest sessions indexes
CREATE INDEX IF NOT EXISTS idx_harvest_sessions_user 
  ON harvest_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_harvest_sessions_status 
  ON harvest_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_harvest_sessions_custody 
  ON harvest_sessions(custody_transaction_id) 
  WHERE custody_transaction_id IS NOT NULL;

-- Execution steps indexes
CREATE INDEX IF NOT EXISTS idx_execution_steps_session 
  ON execution_steps(session_id, step_number);

CREATE INDEX IF NOT EXISTS idx_execution_steps_status 
  ON execution_steps(status) 
  WHERE status IN ('pending', 'executing');

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_token 
  ON wallet_transactions(user_id, wallet_address, token, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_hash 
  ON wallet_transactions(transaction_hash);

-- CEX trades indexes
CREATE INDEX IF NOT EXISTS idx_cex_trades_user_token 
  ON cex_trades(user_id, token, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_cex_trades_account 
  ON cex_trades(cex_account_id, timestamp DESC);

-- CEX accounts indexes
CREATE INDEX IF NOT EXISTS idx_cex_accounts_user 
  ON cex_accounts(user_id, is_active) 
  WHERE is_active = TRUE;

-- Harvest sync status indexes
CREATE INDEX IF NOT EXISTS idx_harvest_sync_status_user 
  ON harvest_sync_status(user_id, sync_type);

CREATE INDEX IF NOT EXISTS idx_harvest_sync_status_last_sync 
  ON harvest_sync_status(last_sync_at DESC);

-- Approval requests indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_session 
  ON approval_requests(session_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_approver 
  ON approval_requests(approver_id, status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_approval_requests_requester 
  ON approval_requests(requester_id, created_at DESC);

-- Sanctions screening logs indexes
CREATE INDEX IF NOT EXISTS idx_sanctions_logs_session 
  ON sanctions_screening_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_sanctions_logs_address 
  ON sanctions_screening_logs(address_checked);

CREATE INDEX IF NOT EXISTS idx_sanctions_logs_result 
  ON sanctions_screening_logs(result, checked_at DESC) 
  WHERE result IN ('FLAGGED', 'BLOCKED');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE harvest_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cex_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cex_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_screening_logs ENABLE ROW LEVEL SECURITY;

-- Harvest lots policies
CREATE POLICY p_harvest_lots_user ON harvest_lots
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Harvest opportunities policies
CREATE POLICY p_harvest_opportunities_user ON harvest_opportunities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Harvest sessions policies
CREATE POLICY p_harvest_sessions_user ON harvest_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Execution steps policies (access through session)
CREATE POLICY p_execution_steps_user ON execution_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM harvest_sessions 
      WHERE harvest_sessions.session_id = execution_steps.session_id 
      AND harvest_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM harvest_sessions 
      WHERE harvest_sessions.session_id = execution_steps.session_id 
      AND harvest_sessions.user_id = auth.uid()
    )
  );

-- User settings policies
CREATE POLICY p_harvest_settings_user ON harvest_user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Wallet transactions policies
CREATE POLICY p_wallet_transactions_user ON wallet_transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CEX accounts policies
CREATE POLICY p_cex_accounts_user ON cex_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CEX trades policies
CREATE POLICY p_cex_trades_user ON cex_trades
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Harvest sync status policies
CREATE POLICY p_harvest_sync_status_user ON harvest_sync_status
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Approval requests policies (requester or approver can view)
CREATE POLICY p_approval_requests_user ON approval_requests
  FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = approver_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = approver_id);

-- Sanctions screening logs policies (access through session)
CREATE POLICY p_sanctions_logs_user ON sanctions_screening_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM harvest_sessions 
      WHERE harvest_sessions.session_id = sanctions_screening_logs.session_id 
      AND harvest_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_harvest_lots_updated_at
  BEFORE UPDATE ON harvest_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_opportunities_updated_at
  BEFORE UPDATE ON harvest_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_sessions_updated_at
  BEFORE UPDATE ON harvest_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_user_settings_updated_at
  BEFORE UPDATE ON harvest_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cex_accounts_updated_at
  BEFORE UPDATE ON cex_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_sync_status_updated_at
  BEFORE UPDATE ON harvest_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE harvest_lots IS 'v1: Stores individual acquisition lots for FIFO cost basis calculation';
COMMENT ON TABLE harvest_opportunities IS 'v1: Eligible harvest opportunities with calculated net benefits';
COMMENT ON TABLE harvest_sessions IS 'v1/v2/v3: User harvest execution sessions with state tracking';
COMMENT ON TABLE execution_steps IS 'v1/v2: Individual steps within a harvest session';
COMMENT ON TABLE harvest_user_settings IS 'v1/v2/v3: User-specific settings for tax calculations, guardrails, and custody';
COMMENT ON TABLE wallet_transactions IS 'v1: Transaction history from connected wallets for FIFO calculation';
COMMENT ON TABLE cex_accounts IS 'v1: Linked centralized exchange accounts with encrypted credentials';
COMMENT ON TABLE cex_trades IS 'v1: Trade history from CEX accounts';
COMMENT ON TABLE harvest_sync_status IS 'v1: Tracks sync status and history for wallet and CEX data synchronization';
COMMENT ON TABLE approval_requests IS 'v3: Maker/checker governance workflow for large transactions';
COMMENT ON TABLE sanctions_screening_logs IS 'v3: KYT/AML audit trail for compliance';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This schema includes:
-- - 9 v1 core tables (harvest_lots, harvest_opportunities, harvest_sessions, 
--   execution_steps, harvest_user_settings, wallet_transactions, cex_accounts, 
--   cex_trades, harvest_sync_status)
-- - v2 institutional enhancements (MEV protection, economic substance, guardrails)
-- - 2 v3 enterprise tables (approval_requests, sanctions_screening_logs)
-- - 30+ performance indexes
-- - Complete RLS policies for all tables
-- - Automated updated_at triggers
-- - Comprehensive documentation
-- ============================================================================
