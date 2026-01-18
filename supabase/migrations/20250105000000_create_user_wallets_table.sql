-- =====================================================
-- Create user_wallets table
-- Multi-Wallet Registry System for persistent wallet management
-- =====================================================

-- Create user_wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'ethereum' NOT NULL,
  chain_namespace TEXT DEFAULT 'eip155:1' NOT NULL,
  source TEXT DEFAULT 'manual', -- 'rainbowkit', 'manual', 'import', etc.
  verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  last_scan TIMESTAMPTZ,
  trust_score INTEGER,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  balance_cache JSONB DEFAULT '{}'::jsonb,
  guardian_scores JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_chain ON user_wallets(chain);
CREATE INDEX IF NOT EXISTS idx_user_wallets_chain_namespace ON user_wallets(chain_namespace);
CREATE INDEX IF NOT EXISTS idx_user_wallets_last_scan ON user_wallets(last_scan);

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
-- Grant permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_wallets TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE user_wallets IS 'Persistent multi-wallet registry for users. Supports Guardian monitoring and Portfolio aggregation.';
COMMENT ON COLUMN user_wallets.address IS 'Ethereum/blockchain address';
COMMENT ON COLUMN user_wallets.chain IS 'Blockchain network (ethereum, polygon, arbitrum, etc.)';
COMMENT ON COLUMN user_wallets.chain_namespace IS 'CAIP-2 format chain identifier (eip155:1, eip155:137, etc.)';
COMMENT ON COLUMN user_wallets.source IS 'How the wallet was added (rainbowkit, manual, import, demo)';
COMMENT ON COLUMN user_wallets.verified IS 'Whether the user has proven ownership via signature';
COMMENT ON COLUMN user_wallets.is_primary IS 'Whether this wallet is the primary/default wallet for the user';
COMMENT ON COLUMN user_wallets.last_scan IS 'Timestamp of last Guardian scan';
COMMENT ON COLUMN user_wallets.trust_score IS 'Latest Guardian trust score (0-100)';
COMMENT ON COLUMN user_wallets.risk_flags IS 'Array of risk indicators from latest scan';
COMMENT ON COLUMN user_wallets.balance_cache IS 'Cached balance data per network';
COMMENT ON COLUMN user_wallets.guardian_scores IS 'Cached Guardian scores per network';
COMMENT ON COLUMN user_wallets.metadata IS 'Additional data (ENS name, labels, tags, etc.)';