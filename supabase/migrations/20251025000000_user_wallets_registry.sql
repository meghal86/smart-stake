-- =====================================================
-- Multi-Wallet Registry System
-- Persistent wallet management for Guardian + Portfolio
-- =====================================================

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'ethereum' NOT NULL,
  source TEXT, -- 'rainbowkit', 'manual', 'import', etc.
  verified BOOLEAN DEFAULT false,
  last_scan TIMESTAMPTZ,
  trust_score INTEGER,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique wallet per user
  UNIQUE(user_id, address, chain)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_chain ON user_wallets(chain);
CREATE INDEX IF NOT EXISTS idx_user_wallets_last_scan ON user_wallets(last_scan);

-- Enable RLS (Row Level Security)
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own wallets
CREATE POLICY "Users can view their own wallets"
  ON user_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own wallets
CREATE POLICY "Users can add their own wallets"
  ON user_wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallets
CREATE POLICY "Users can update their own wallets"
  ON user_wallets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own wallets
CREATE POLICY "Users can delete their own wallets"
  ON user_wallets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_user_wallets_updated_at();

-- =====================================================
-- Link Guardian Results to User Wallets
-- =====================================================

-- Add foreign key to guardian_results if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'guardian_results') THEN
    -- Add wallet_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'guardian_results' 
      AND column_name = 'wallet_id'
    ) THEN
      ALTER TABLE guardian_results ADD COLUMN wallet_id UUID REFERENCES user_wallets(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_guardian_results_wallet_id ON guardian_results(wallet_id);
    END IF;
  END IF;
END $$;

-- =====================================================
-- Helper Views
-- =====================================================

-- View: User wallet summary with latest scan data
CREATE OR REPLACE VIEW user_wallet_summary AS
SELECT 
  uw.id,
  uw.user_id,
  uw.address,
  uw.label,
  uw.chain,
  uw.source,
  uw.verified,
  uw.last_scan,
  uw.trust_score,
  uw.risk_flags,
  uw.created_at,
  uw.updated_at,
  COUNT(DISTINCT gr.id) as scan_count,
  MAX(gr.scanned_at) as latest_scan_at
FROM user_wallets uw
LEFT JOIN guardian_results gr ON gr.wallet_address = uw.address AND gr.user_id = uw.user_id
GROUP BY uw.id;

-- Grant access to authenticated users
GRANT SELECT ON user_wallet_summary TO authenticated;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get all wallets for a user
CREATE OR REPLACE FUNCTION get_user_wallets(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  address TEXT,
  label TEXT,
  chain TEXT,
  source TEXT,
  verified BOOLEAN,
  last_scan TIMESTAMPTZ,
  trust_score INTEGER,
  risk_flags JSONB,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.address,
    uw.label,
    uw.chain,
    uw.source,
    uw.verified,
    uw.last_scan,
    uw.trust_score,
    uw.risk_flags,
    uw.created_at
  FROM user_wallets uw
  WHERE uw.user_id = p_user_id
  ORDER BY uw.created_at DESC;
END;
$$;

-- Function: Add or update wallet
CREATE OR REPLACE FUNCTION upsert_user_wallet(
  p_user_id UUID,
  p_address TEXT,
  p_chain TEXT DEFAULT 'ethereum',
  p_label TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'manual'
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  INSERT INTO user_wallets (
    user_id,
    address,
    chain,
    label,
    source
  ) VALUES (
    p_user_id,
    LOWER(p_address), -- normalize address to lowercase
    p_chain,
    p_label,
    p_source
  )
  ON CONFLICT (user_id, address, chain) 
  DO UPDATE SET
    label = COALESCE(EXCLUDED.label, user_wallets.label),
    source = COALESCE(EXCLUDED.source, user_wallets.source),
    updated_at = NOW()
  RETURNING id INTO v_wallet_id;
  
  RETURN v_wallet_id;
END;
$$;

-- Function: Update wallet scan results
CREATE OR REPLACE FUNCTION update_wallet_scan_results(
  p_wallet_id UUID,
  p_trust_score INTEGER,
  p_risk_flags JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_wallets
  SET 
    trust_score = p_trust_score,
    risk_flags = p_risk_flags,
    last_scan = NOW(),
    updated_at = NOW()
  WHERE id = p_wallet_id;
END;
$$;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_wallets TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wallets TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION update_wallet_scan_results TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE user_wallets IS 'Persistent multi-wallet registry for users. Supports Guardian monitoring and Portfolio aggregation.';
COMMENT ON COLUMN user_wallets.address IS 'Ethereum/blockchain address (normalized to lowercase)';
COMMENT ON COLUMN user_wallets.chain IS 'Blockchain network (ethereum, polygon, arbitrum, etc.)';
COMMENT ON COLUMN user_wallets.source IS 'How the wallet was added (rainbowkit, manual, import, demo)';
COMMENT ON COLUMN user_wallets.verified IS 'Whether the user has proven ownership via signature';
COMMENT ON COLUMN user_wallets.last_scan IS 'Timestamp of last Guardian scan';
COMMENT ON COLUMN user_wallets.trust_score IS 'Latest Guardian trust score (0-100)';
COMMENT ON COLUMN user_wallets.risk_flags IS 'Array of risk indicators from latest scan';
COMMENT ON COLUMN user_wallets.metadata IS 'Additional data (ENS name, labels, tags, etc.)';

