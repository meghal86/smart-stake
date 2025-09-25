-- Whale Transfers Table (raw whale transaction data)
CREATE TABLE IF NOT EXISTS whale_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount_usd DECIMAL NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_entity TEXT, -- binance, okx, etc.
  to_entity TEXT,
  tags TEXT[], -- swap, lend, stake, bridge, etc.
  counterparty_type TEXT, -- amm, lending, bridge, perps
  tx_hash TEXT,
  block_number BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Whale Balances Table (current balance context)
CREATE TABLE IF NOT EXISTS whale_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  balance_usd DECIMAL NOT NULL,
  dormant_days INTEGER DEFAULT 0,
  last_activity_ts TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(address, chain)
);

-- Whale Signals Table (behavioral signals and risk indicators)
CREATE TABLE IF NOT EXISTS whale_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0,
  reason_codes TEXT[],
  net_flow_24h DECIMAL DEFAULT 0,
  to_cex_ratio DECIMAL DEFAULT 0,
  unique_recipients_24h INTEGER DEFAULT 0,
  confidence DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(address, chain)
);

-- Whale Clusters Table (computed clusters)
CREATE TABLE IF NOT EXISTS whale_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_type TEXT NOT NULL, -- DORMANT_WAKING, CEX_INFLOW, etc.
  name TEXT NOT NULL,
  chain TEXT NOT NULL,
  members_count INTEGER DEFAULT 0,
  sum_balance_usd DECIMAL DEFAULT 0,
  net_flow_24h DECIMAL DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  confidence DECIMAL DEFAULT 0,
  stats JSONB DEFAULT '{}',
  thread_keys TEXT[], -- for grouping related alerts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cluster Members Junction Table
CREATE TABLE IF NOT EXISTS whale_cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES whale_clusters(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  balance_usd DECIMAL DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  reason_codes TEXT[],
  last_activity_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cluster_id, address, chain)
);

-- Chain Quantiles Table (rolling 30d quantiles per chain)
CREATE TABLE IF NOT EXISTS chain_quantiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  q70_usd DECIMAL NOT NULL,
  q80_usd DECIMAL NOT NULL,
  q85_usd DECIMAL NOT NULL,
  q90_usd DECIMAL NOT NULL,
  q80_defi_usd DECIMAL NOT NULL,
  q80_net_in_usd DECIMAL NOT NULL,
  q80_net_out_usd DECIMAL NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_transfers_timestamp ON whale_transfers(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_chain ON whale_transfers(chain);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_amount ON whale_transfers(amount_usd DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_from_address ON whale_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_to_address ON whale_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_entities ON whale_transfers(from_entity, to_entity);

CREATE INDEX IF NOT EXISTS idx_whale_balances_address ON whale_balances(address);
CREATE INDEX IF NOT EXISTS idx_whale_balances_chain ON whale_balances(chain);
CREATE INDEX IF NOT EXISTS idx_whale_balances_dormant ON whale_balances(dormant_days DESC);

CREATE INDEX IF NOT EXISTS idx_whale_signals_address ON whale_signals(address);
CREATE INDEX IF NOT EXISTS idx_whale_signals_chain ON whale_signals(chain);
CREATE INDEX IF NOT EXISTS idx_whale_signals_risk ON whale_signals(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_whale_clusters_type ON whale_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_whale_clusters_chain ON whale_clusters(chain);
CREATE INDEX IF NOT EXISTS idx_whale_clusters_balance ON whale_clusters(sum_balance_usd DESC);

-- RLS Policies (allow read access for authenticated users)
ALTER TABLE whale_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_quantiles ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON whale_transfers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON whale_balances
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON whale_signals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON whale_clusters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON whale_cluster_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON chain_quantiles
  FOR SELECT TO authenticated USING (true);

-- Insert some sample data for testing
INSERT INTO whale_transfers (from_address, to_address, amount_usd, token, chain, from_entity, to_entity, tags) VALUES
('0x1234567890123456789012345678901234567890', '0x0987654321098765432109876543210987654321', 1500000, 'USDT', 'ETH', 'binance', null, ARRAY['swap']),
('0x2345678901234567890123456789012345678901', '0x1987654321098765432109876543210987654321', 2500000, 'USDC', 'ETH', null, 'coinbase', ARRAY['bridge']),
('0x3456789012345678901234567890123456789012', '0x2987654321098765432109876543210987654321', 750000, 'ETH', 'ETH', null, null, ARRAY['lend', 'defi'])
ON CONFLICT DO NOTHING;

INSERT INTO whale_balances (address, chain, balance_usd, dormant_days) VALUES
('0x1234567890123456789012345678901234567890', 'ETH', 50000000, 45),
('0x2345678901234567890123456789012345678901', 'ETH', 25000000, 0),
('0x3456789012345678901234567890123456789012', 'ETH', 15000000, 5)
ON CONFLICT (address, chain) DO UPDATE SET
  balance_usd = EXCLUDED.balance_usd,
  dormant_days = EXCLUDED.dormant_days,
  updated_at = NOW();

INSERT INTO whale_signals (address, chain, risk_score, reason_codes, net_flow_24h, to_cex_ratio, unique_recipients_24h) VALUES
('0x1234567890123456789012345678901234567890', 'ETH', 75, ARRAY['dormant_waking', 'large_transfer'], -1500000, 0.3, 2),
('0x2345678901234567890123456789012345678901', 'ETH', 45, ARRAY['cex_activity'], 2500000, 0.8, 1),
('0x3456789012345678901234567890123456789012', 'ETH', 30, ARRAY['defi_activity'], 750000, 0.1, 5)
ON CONFLICT (address, chain) DO UPDATE SET
  risk_score = EXCLUDED.risk_score,
  reason_codes = EXCLUDED.reason_codes,
  net_flow_24h = EXCLUDED.net_flow_24h,
  to_cex_ratio = EXCLUDED.to_cex_ratio,
  unique_recipients_24h = EXCLUDED.unique_recipients_24h,
  updated_at = NOW();

INSERT INTO chain_quantiles (chain, q70_usd, q80_usd, q85_usd, q90_usd, q80_defi_usd, q80_net_in_usd, q80_net_out_usd) VALUES
('ETH', 50000, 100000, 250000, 500000, 50000, 100000, 100000),
('SOL', 25000, 50000, 100000, 200000, 25000, 50000, 50000),
('BTC', 100000, 200000, 500000, 1000000, 100000, 200000, 200000)
ON CONFLICT (chain) DO UPDATE SET
  q70_usd = EXCLUDED.q70_usd,
  q80_usd = EXCLUDED.q80_usd,
  q85_usd = EXCLUDED.q85_usd,
  q90_usd = EXCLUDED.q90_usd,
  q80_defi_usd = EXCLUDED.q80_defi_usd,
  q80_net_in_usd = EXCLUDED.q80_net_in_usd,
  q80_net_out_usd = EXCLUDED.q80_net_out_usd,
  calculated_at = NOW();