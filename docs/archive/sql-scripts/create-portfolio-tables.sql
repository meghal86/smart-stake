-- Create portfolio_snapshots table
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  total_value_usd DECIMAL(20,2),
  risk_score DECIMAL(3,1),
  whale_interactions INTEGER DEFAULT 0,
  holdings JSONB,
  snapshot_time TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_portfolio_snapshots_address_time 
ON portfolio_snapshots(address, snapshot_time DESC);

-- Enable RLS and policy
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_snapshots_select" ON portfolio_snapshots FOR SELECT USING (true);