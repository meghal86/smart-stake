-- Guardian Multi-Wallet Management Schema

-- Create guardian_wallets table
CREATE TABLE IF NOT EXISTS guardian_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  alias TEXT,
  trust_score INTEGER,
  risk_count INTEGER DEFAULT 0,
  last_scan TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT guardian_wallets_address_check CHECK (length(address) = 42 AND address ~ '^0x[a-fA-F0-9]{40}$'),
  CONSTRAINT guardian_wallets_trust_score_check CHECK (trust_score >= 0 AND trust_score <= 100),
  CONSTRAINT guardian_wallets_risk_count_check CHECK (risk_count >= 0),
  CONSTRAINT guardian_wallets_unique_user_address UNIQUE (user_id, address)
);

-- Enable RLS
ALTER TABLE guardian_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wallets" ON guardian_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON guardian_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON guardian_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets" ON guardian_wallets
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guardian_wallets_user_id ON guardian_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_guardian_wallets_address ON guardian_wallets(address);
CREATE INDEX IF NOT EXISTS idx_guardian_wallets_last_scan ON guardian_wallets(last_scan);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_guardian_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guardian_wallets_updated_at
  BEFORE UPDATE ON guardian_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_guardian_wallets_updated_at();