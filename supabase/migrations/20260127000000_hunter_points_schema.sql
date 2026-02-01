 -- Hunter Points/Loyalty Module Schema
-- Migration: Add points-specific columns to opportunities table
-- Create user_points_status table for tracking user points

-- Add points-specific columns to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS points_program_name TEXT,
ADD COLUMN IF NOT EXISTS conversion_hint TEXT,
ADD COLUMN IF NOT EXISTS points_estimate_formula TEXT;

-- Create user_points_status table
CREATE TABLE IF NOT EXISTS user_points_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  estimated_value_usd NUMERIC,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_points_status_user_wallet 
ON user_points_status (user_id, wallet_address);

CREATE INDEX IF NOT EXISTS idx_user_points_status_opportunity 
ON user_points_status (opportunity_id);

-- Enable RLS on user_points_status
ALTER TABLE user_points_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own points status
CREATE POLICY p_user_points_status_user
ON user_points_status
FOR ALL
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE user_points_status IS 'Tracks user points earned from loyalty programs';
COMMENT ON COLUMN opportunities.points_program_name IS 'Name of the points/loyalty program';
COMMENT ON COLUMN opportunities.conversion_hint IS 'Human-readable hint about points value (e.g., "1000 points ≈ $10 airdrop")';
COMMENT ON COLUMN opportunities.points_estimate_formula IS 'Formula for estimating points value';
