-- Migration: Add yield-specific columns to opportunities table
-- Requirements: 3.1-3.7

-- Add yield/staking specific columns
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS apy NUMERIC,
ADD COLUMN IF NOT EXISTS tvl_usd NUMERIC,
ADD COLUMN IF NOT EXISTS underlying_assets TEXT[],
ADD COLUMN IF NOT EXISTS lockup_days INTEGER;

-- Create user_yield_positions table (optional for v1, but included for completeness)
CREATE TABLE IF NOT EXISTS user_yield_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_deposited NUMERIC,
  current_value NUMERIC,
  apy_at_deposit NUMERIC,
  deposited_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_yield_positions_user_id 
ON user_yield_positions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_yield_positions_opportunity_id 
ON user_yield_positions (opportunity_id);

CREATE INDEX IF NOT EXISTS idx_user_yield_positions_wallet 
ON user_yield_positions (wallet_address);

-- Add RLS policies for user_yield_positions
ALTER TABLE user_yield_positions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own positions
CREATE POLICY IF NOT EXISTS p_user_yield_positions_select
ON user_yield_positions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own positions
CREATE POLICY IF NOT EXISTS p_user_yield_positions_insert
ON user_yield_positions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own positions
CREATE POLICY IF NOT EXISTS p_user_yield_positions_update
ON user_yield_positions
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own positions
CREATE POLICY IF NOT EXISTS p_user_yield_positions_delete
ON user_yield_positions
FOR DELETE
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE user_yield_positions IS 'Tracks user positions in yield/staking opportunities';
COMMENT ON COLUMN opportunities.apy IS 'Annual Percentage Yield (APY) for yield/staking opportunities';
COMMENT ON COLUMN opportunities.tvl_usd IS 'Total Value Locked in USD for yield/staking opportunities';
COMMENT ON COLUMN opportunities.underlying_assets IS 'Array of underlying asset symbols (e.g., [ETH, USDC])';
COMMENT ON COLUMN opportunities.lockup_days IS 'Number of days assets are locked (null if no lockup)';
