-- Enhanced portfolio snapshots schema for production
CREATE TABLE IF NOT EXISTS portfolio_snapshots_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addresses TEXT[] NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_value NUMERIC(20,2),
  pnl_24h NUMERIC(20,2),
  risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
  concentration_hhi NUMERIC(5,4),
  sim_version TEXT NOT NULL,
  holdings JSONB NOT NULL, -- Array of {token, qty, value, source, change_24h}
  meta JSONB NOT NULL,     -- {cache_status, latency_ms, circuit_breaker_state}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_v2_user_ts ON portfolio_snapshots_v2(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_v2_ts ON portfolio_snapshots_v2(ts DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_v2_sim_version ON portfolio_snapshots_v2(sim_version);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_portfolio_v2_holdings_gin ON portfolio_snapshots_v2 USING GIN(holdings);
CREATE INDEX IF NOT EXISTS idx_portfolio_v2_meta_gin ON portfolio_snapshots_v2 USING GIN(meta);

-- RLS policies
ALTER TABLE portfolio_snapshots_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own portfolio snapshots" 
ON portfolio_snapshots_v2 
FOR ALL USING (auth.uid() = user_id);

-- Health monitoring table
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  metrics JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_health_service_time ON system_health(service_name, checked_at DESC);