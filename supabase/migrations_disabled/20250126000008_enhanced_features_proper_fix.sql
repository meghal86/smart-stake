-- Enhanced Quant Market Hub - Proper SQL Fix

-- 1. Chain Risk History for Sparklines
CREATE TABLE IF NOT EXISTS chain_risk_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  concentration_risk INTEGER NOT NULL,
  flow_risk INTEGER NOT NULL,
  activity_risk INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain, snapshot_date)
);

-- 2. Simplified Correlation Analysis with Spike Detection
CREATE MATERIALIZED VIEW IF NOT EXISTS correlation_spikes_hourly AS
WITH chain_stats AS (
  SELECT 
    chain,
    AVG(chain_flow) as avg_flow,
    STDDEV(chain_flow) as stddev_flow,
    MAX(chain_flow) as max_flow
  FROM cluster_chain_correlation_hourly
  WHERE hour >= NOW() - INTERVAL '24 hours'
  GROUP BY chain
)
SELECT
  c.chain,
  c.cluster_type,
  c.hour,
  c.chain_flow,
  -- Simple spike detection: flow > avg + 2*stddev
  CASE 
    WHEN c.chain_flow > (cs.avg_flow + 2 * COALESCE(cs.stddev_flow, 0)) THEN true
    ELSE false
  END AS is_spike,
  -- Mark chains with spikes for correlation
  CASE 
    WHEN c.cluster_type IN ('DORMANT_WAKING', 'CEX_INFLOW') 
    AND c.chain_flow > (cs.avg_flow + 2 * COALESCE(cs.stddev_flow, 0)) 
    THEN ARRAY[c.chain]
    ELSE ARRAY[]::TEXT[]
  END AS correlated_chains,
  cs.avg_flow,
  cs.stddev_flow
FROM cluster_chain_correlation_hourly c
JOIN chain_stats cs ON cs.chain = c.chain
WHERE c.hour >= NOW() - INTERVAL '24 hours';

-- 3. Alert Digest with Transaction Links
CREATE TABLE IF NOT EXISTS alert_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID,
  cluster_id TEXT,
  digest_type TEXT NOT NULL CHECK (digest_type IN ('transaction_spike', 'cluster_formation', 'risk_elevation')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cta_actions JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies
ALTER TABLE chain_risk_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_digest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to chain risk history" ON chain_risk_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to alert digest" ON alert_digest FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access chain risk history" ON chain_risk_history FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access alert digest" ON alert_digest FOR ALL TO service_role USING (true);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_chain_risk_history_chain_date ON chain_risk_history(chain, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_alert_digest_created_at ON alert_digest(created_at DESC);

-- 6. Enhanced Refresh Function
CREATE OR REPLACE FUNCTION refresh_enhanced_market_hub_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW chain_features_24h;
  REFRESH MATERIALIZED VIEW chain_risk_normalized;
  REFRESH MATERIALIZED VIEW cluster_chain_correlation_hourly;
  REFRESH MATERIALIZED VIEW correlation_spikes_hourly;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to populate historical data
CREATE OR REPLACE FUNCTION populate_chain_risk_history()
RETURNS void AS $$
DECLARE
  day_offset INTEGER;
  target_date DATE;
BEGIN
  -- Generate 7 days of historical data for ETH and BTC
  FOR day_offset IN 1..7 LOOP
    target_date := (NOW() - INTERVAL '1 day' * day_offset)::DATE;
    
    -- ETH historical data
    INSERT INTO chain_risk_history (chain, snapshot_date, risk_score, concentration_risk, flow_risk, activity_risk)
    VALUES (
      'ETH',
      target_date,
      GREATEST(0, LEAST(100, 45 + (RANDOM() * 30 - 15)::INTEGER)),
      GREATEST(0, LEAST(100, 20 + (RANDOM() * 20 - 10)::INTEGER)),
      GREATEST(0, LEAST(100, 15 + (RANDOM() * 20 - 10)::INTEGER)),
      GREATEST(0, LEAST(100, 10 + (RANDOM() * 20 - 10)::INTEGER))
    )
    ON CONFLICT (chain, snapshot_date) DO NOTHING;
    
    -- BTC historical data
    INSERT INTO chain_risk_history (chain, snapshot_date, risk_score, concentration_risk, flow_risk, activity_risk)
    VALUES (
      'BTC',
      target_date,
      GREATEST(0, LEAST(100, 22 + (RANDOM() * 30 - 15)::INTEGER)),
      GREATEST(0, LEAST(100, 9 + (RANDOM() * 20 - 10)::INTEGER)),
      GREATEST(0, LEAST(100, 7 + (RANDOM() * 20 - 10)::INTEGER)),
      GREATEST(0, LEAST(100, 6 + (RANDOM() * 20 - 10)::INTEGER))
    )
    ON CONFLICT (chain, snapshot_date) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Call the function to populate data
SELECT populate_chain_risk_history();