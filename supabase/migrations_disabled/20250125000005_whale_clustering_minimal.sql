-- Minimal whale clustering tables (no RLS conflicts)

CREATE TABLE IF NOT EXISTS whale_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount_usd DECIMAL NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_entity TEXT,
  to_entity TEXT,
  tags TEXT[],
  counterparty_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whale_transfers_timestamp ON whale_transfers(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_chain ON whale_transfers(chain);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_amount ON whale_transfers(amount_usd DESC);

-- Tables created without sample data