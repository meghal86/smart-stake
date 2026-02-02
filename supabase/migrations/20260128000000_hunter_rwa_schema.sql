-- Hunter RWA Vaults Module Schema
-- Migration: Add RWA-specific columns to opportunities table
-- Create user_rwa_positions table for tracking user RWA positions

-- Add RWA-specific columns to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS issuer_name TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
ADD COLUMN IF NOT EXISTS kyc_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_investment NUMERIC,
ADD COLUMN IF NOT EXISTS liquidity_term_days INTEGER,
ADD COLUMN IF NOT EXISTS rwa_type TEXT;

-- Create user_rwa_positions table
CREATE TABLE IF NOT EXISTS user_rwa_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_invested NUMERIC,
  current_value NUMERIC,
  kyc_completed BOOLEAN DEFAULT FALSE,
  invested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_rwa_positions_user_wallet 
ON user_rwa_positions (user_id, wallet_address);

CREATE INDEX IF NOT EXISTS idx_user_rwa_positions_opportunity 
ON user_rwa_positions (opportunity_id);

-- Enable RLS on user_rwa_positions
ALTER TABLE user_rwa_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own RWA positions
CREATE POLICY p_user_rwa_positions_user
ON user_rwa_positions
FOR ALL
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE user_rwa_positions IS 'Tracks user positions in RWA vaults';
COMMENT ON COLUMN opportunities.issuer_name IS 'Name of the RWA vault issuer';
COMMENT ON COLUMN opportunities.jurisdiction IS 'Legal jurisdiction of the RWA vault';
COMMENT ON COLUMN opportunities.kyc_required IS 'Whether KYC is required to invest';
COMMENT ON COLUMN opportunities.min_investment IS 'Minimum investment amount in USD';
COMMENT ON COLUMN opportunities.liquidity_term_days IS 'Liquidity lock-up period in days';
COMMENT ON COLUMN opportunities.rwa_type IS 'Type of RWA (treasury, credit, real_estate, trade_finance)';
