-- Enhanced Features - Minimal Working Version

-- 1. Chain Risk History Table
CREATE TABLE IF NOT EXISTS chain_risk_history (
  chain TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  risk_score INTEGER NOT NULL,
  PRIMARY KEY (chain, snapshot_date)
);

-- 2. Insert Sample Historical Data
INSERT INTO chain_risk_history (chain, snapshot_date, risk_score) VALUES
('ETH', CURRENT_DATE - 7, 38),
('ETH', CURRENT_DATE - 6, 42),
('ETH', CURRENT_DATE - 5, 39),
('ETH', CURRENT_DATE - 4, 45),
('ETH', CURRENT_DATE - 3, 48),
('ETH', CURRENT_DATE - 2, 44),
('ETH', CURRENT_DATE - 1, 45),
('BTC', CURRENT_DATE - 7, 18),
('BTC', CURRENT_DATE - 6, 22),
('BTC', CURRENT_DATE - 5, 19),
('BTC', CURRENT_DATE - 4, 24),
('BTC', CURRENT_DATE - 3, 26),
('BTC', CURRENT_DATE - 2, 21),
('BTC', CURRENT_DATE - 1, 22)
ON CONFLICT DO NOTHING;

-- 3. Correlation Spikes View (Simplified)
CREATE VIEW correlation_spikes AS
SELECT 
  chain,
  CASE WHEN chain = 'ETH' THEN true ELSE false END as is_spike,
  ARRAY[chain] as correlated_chains
FROM (VALUES ('ETH'), ('BTC')) AS chains(chain);

-- 4. RLS Policy
ALTER TABLE chain_risk_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read chain history" ON chain_risk_history FOR SELECT TO authenticated USING (true);