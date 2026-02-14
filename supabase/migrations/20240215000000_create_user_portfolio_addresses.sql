-- Create user_portfolio_addresses table for storing user wallet addresses
-- This table is required for portfolio aggregation across multiple wallets

CREATE TABLE IF NOT EXISTS user_portfolio_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'ethereum',
  is_primary BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  
  -- Ensure unique address per user
  UNIQUE(user_id, address)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_portfolio_addresses_user_id 
  ON user_portfolio_addresses(user_id);

-- Create index for address lookups
CREATE INDEX IF NOT EXISTS idx_user_portfolio_addresses_address 
  ON user_portfolio_addresses(address);

-- Enable Row Level Security
ALTER TABLE user_portfolio_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own addresses
CREATE POLICY "Users can view their own addresses"
  ON user_portfolio_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
  ON user_portfolio_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
  ON user_portfolio_addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
  ON user_portfolio_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE user_portfolio_addresses IS 'Stores wallet addresses associated with user accounts for portfolio tracking';
