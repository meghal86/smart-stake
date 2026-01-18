-- Add missing columns to user_wallets table
-- Run this in your Supabase SQL editor

-- Add source column (how the wallet was added)
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add verified column (whether user has proven ownership)
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Add last_scan column (for Guardian integration)
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS last_scan TIMESTAMPTZ;

-- Add trust_score column (for Guardian scores)
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS trust_score INTEGER;

-- Add risk_flags column (for Guardian risk indicators)
ALTER TABLE user_wallets 
ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have default values
UPDATE user_wallets 
SET 
  source = 'manual',
  verified = false
WHERE source IS NULL OR verified IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_wallets.source IS 'How the wallet was added (manual, rainbowkit, import, etc.)';
COMMENT ON COLUMN user_wallets.verified IS 'Whether the user has proven ownership via signature';
COMMENT ON COLUMN user_wallets.last_scan IS 'Timestamp of last Guardian scan';
COMMENT ON COLUMN user_wallets.trust_score IS 'Latest Guardian trust score (0-100)';
COMMENT ON COLUMN user_wallets.risk_flags IS 'Array of risk indicators from latest scan';