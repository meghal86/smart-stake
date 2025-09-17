-- Phase 1: Portfolio Analytics Tables
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  total_value_usd DECIMAL NOT NULL,
  token_breakdown JSONB NOT NULL,
  snapshot_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_holdings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  symbol TEXT NOT NULL,
  token_type TEXT CHECK (token_type IN ('ERC-20', 'ERC-721', 'ERC-1155')),
  balance DECIMAL NOT NULL,
  value_usd DECIMAL NOT NULL,
  price_change_24h DECIMAL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 10),
  contract_verified BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: Transaction Analysis Tables
CREATE TABLE IF NOT EXISTS address_labels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_graph_nodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  label TEXT,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 10),
  total_volume DECIMAL DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  entity_type TEXT CHECK (entity_type IN ('exchange', 'defi', 'wallet', 'mixer', 'unknown')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 3: DeFi & NFT Tables
CREATE TABLE IF NOT EXISTS defi_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  protocol TEXT NOT NULL,
  chain TEXT NOT NULL,
  position_type TEXT CHECK (position_type IN ('lending', 'borrowing', 'liquidity', 'staking')),
  token_symbol TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  value_usd DECIMAL NOT NULL,
  apy DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nft_holdings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  floor_price DECIMAL,
  last_sale DECIMAL,
  rarity_rank INTEGER,
  estimated_value DECIMAL,
  liquidity_score DECIMAL CHECK (liquidity_score >= 0 AND liquidity_score <= 1),
  metadata JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 4: AI Risk Intelligence Tables
CREATE TABLE IF NOT EXISTS risk_alert_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_value DECIMAL,
  notification_channels TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_breakdowns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 10),
  transaction_volume_score INTEGER,
  counterparty_risk_score INTEGER,
  geographic_risk_score INTEGER,
  behavior_pattern_score INTEGER,
  compliance_flags_score INTEGER,
  factors JSONB NOT NULL,
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5: Reporting & Collaboration Tables
CREATE TABLE IF NOT EXISTS wallet_annotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  annotation TEXT NOT NULL,
  category TEXT,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_exports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  report_config JSONB NOT NULL,
  file_url TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add enhanced columns to existing risk_scans table
ALTER TABLE risk_scans ADD COLUMN IF NOT EXISTS token_holdings JSONB;
ALTER TABLE risk_scans ADD COLUMN IF NOT EXISTS defi_positions JSONB;
ALTER TABLE risk_scans ADD COLUMN IF NOT EXISTS nft_holdings JSONB;
ALTER TABLE risk_scans ADD COLUMN IF NOT EXISTS risk_breakdown JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_wallet ON portfolio_snapshots(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_holdings_wallet ON token_holdings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_address_labels_address ON address_labels(address);
CREATE INDEX IF NOT EXISTS idx_defi_positions_wallet ON defi_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_holdings_wallet ON nft_holdings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_risk_alert_rules_user ON risk_alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_annotations_wallet ON wallet_annotations(wallet_address);

-- Enable RLS on new tables
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE defi_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read access" ON portfolio_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read access" ON token_holdings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON address_labels FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transaction_graph_nodes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON defi_positions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON nft_holdings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON risk_breakdowns FOR SELECT USING (true);

CREATE POLICY "Users manage own alert rules" ON risk_alert_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own annotations" ON wallet_annotations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own reports" ON report_exports FOR ALL USING (auth.uid() = user_id);