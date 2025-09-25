-- Full Quant Market Hub - Complete Database Foundation
-- Phase 1: Real quantitative risk calculation with materialized views

-- 1. Chain Features (24h rolling window)
CREATE MATERIALIZED VIEW chain_features_24h AS
SELECT
  chain,
  COUNT(DISTINCT from_address) AS whale_count,
  SUM(CASE WHEN amount_usd > 0 THEN amount_usd ELSE 0 END) AS total_inflow,
  SUM(CASE WHEN amount_usd < 0 THEN ABS(amount_usd) ELSE 0 END) AS total_outflow,
  SUM(amount_usd) AS net_flow,
  COUNT(*) AS tx_count,
  MAX(timestamp) AS refreshed_at
FROM whale_transfers
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY chain;

-- 2. Daily Risk Snapshot with Real Component Calculation
CREATE MATERIALIZED VIEW chain_risk_today AS
SELECT
  cf.chain,
  cf.whale_count,
  cf.net_flow,
  cf.tx_count,
  -- Real Component Scores (0-100)
  LEAST(100, GREATEST(0, (cf.whale_count::float / NULLIF(totals.total_whales, 0)) * 100)) AS concentration_risk,
  LEAST(100, GREATEST(0, (ABS(cf.net_flow)::float / NULLIF(totals.total_flow, 0)) * 100)) AS flow_risk,
  LEAST(100, GREATEST(0, (cf.tx_count::float / NULLIF(totals.max_tx, 1)) * 100)) AS activity_risk,
  NOW()::date AS snapshot_date
FROM chain_features_24h cf
CROSS JOIN (
  SELECT 
    SUM(whale_count) AS total_whales,
    SUM(ABS(net_flow)) AS total_flow,
    MAX(tx_count) AS max_tx
  FROM chain_features_24h
) totals;

-- 3. 30-day History for Normalization
CREATE MATERIALIZED VIEW chain_risk_history AS
SELECT 
  chain,
  snapshot_date,
  concentration_risk,
  flow_risk,
  activity_risk,
  -- Final Risk Score (weighted average)
  ROUND((concentration_risk * 0.4 + flow_risk * 0.35 + activity_risk * 0.25)) AS risk_score
FROM chain_risk_today
WHERE snapshot_date >= NOW() - INTERVAL '30 days';

-- 4. Normalized Risk Scores (0-100 scale)
CREATE MATERIALIZED VIEW chain_risk_normalized AS
SELECT
  crt.chain,
  crt.snapshot_date,
  -- Final weighted risk score
  LEAST(100, GREATEST(0, ROUND(
    (crt.concentration_risk * 0.4 + crt.flow_risk * 0.35 + crt.activity_risk * 0.25)
  ))) AS risk_score,
  crt.concentration_risk,
  crt.flow_risk,
  crt.activity_risk,
  -- Coverage check
  CASE 
    WHEN cf.whale_count < 3 THEN 'insufficient_data'
    WHEN cf.tx_count < 50 THEN 'low_activity'
    WHEN ABS(cf.net_flow) < 1000000 THEN 'low_volume'
    ELSE NULL
  END AS reason,
  cf.whale_count,
  cf.tx_count,
  ABS(cf.net_flow) AS volume_24h
FROM chain_risk_today crt
JOIN chain_features_24h cf ON cf.chain = crt.chain;

-- 5. Correlation Analysis (Hourly Buckets)
CREATE MATERIALIZED VIEW cluster_chain_correlation_hourly AS
SELECT
  wt.chain,
  wc.cluster_type,
  DATE_TRUNC('hour', wt.timestamp) AS hour,
  SUM(wt.amount_usd) AS chain_flow,
  COUNT(*) AS tx_count,
  AVG(wt.amount_usd) AS avg_tx_size
FROM whale_transfers wt
JOIN whale_clusters wc ON wc.chain = wt.chain
WHERE wt.timestamp >= NOW() - INTERVAL '7 days'
GROUP BY wt.chain, wc.cluster_type, DATE_TRUNC('hour', wt.timestamp);

-- 6. Whale Clustering Enhanced
CREATE TABLE IF NOT EXISTS whale_clusters_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_type TEXT NOT NULL CHECK (cluster_type IN ('DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION')),
  chain TEXT NOT NULL,
  name TEXT NOT NULL,
  members_count INTEGER DEFAULT 0,
  sum_balance_usd BIGINT DEFAULT 0,
  net_flow_24h BIGINT DEFAULT 0,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  classification_reasons TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Alert Classification Rules Table
CREATE TABLE IF NOT EXISTS alert_classification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  priority INTEGER NOT NULL, -- Lower = higher priority
  conditions JSONB NOT NULL, -- Rule conditions
  cluster_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
  confidence_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Classification Rules (Priority Order)
INSERT INTO alert_classification_rules (rule_name, priority, conditions, cluster_type, severity, confidence_score) VALUES
('dormant_waking', 1, '{"min_amount_usd": 10000000, "dormant_days": 30}', 'DORMANT_WAKING', 'High', 0.90),
('cex_inflow_large', 2, '{"min_amount_usd": 5000000, "to_entity_type": "cex"}', 'CEX_INFLOW', 'High', 0.85),
('defi_activity', 3, '{"min_amount_usd": 1000000, "has_defi_tags": true}', 'DEFI_ACTIVITY', 'Medium', 0.80),
('distribution_pattern', 4, '{"min_amount_usd": 2000000, "to_entity_type": "unknown", "tx_count_24h": 5}', 'DISTRIBUTION', 'Medium', 0.70),
('accumulation_whale', 5, '{"min_amount_usd": 1000000}', 'ACCUMULATION', 'Low', 0.60);

-- 8. Coverage Metrics Table
CREATE TABLE IF NOT EXISTS coverage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  window_hours INTEGER NOT NULL,
  whale_count INTEGER NOT NULL,
  tx_count INTEGER NOT NULL,
  volume_usd BIGINT NOT NULL,
  coverage_percentage DECIMAL(5,2) NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Performance Monitoring
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  error_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_whale_transfers_timestamp_chain ON whale_transfers(timestamp DESC, chain);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_amount_usd ON whale_transfers(amount_usd DESC);
CREATE INDEX IF NOT EXISTS idx_whale_clusters_enhanced_type_chain ON whale_clusters_enhanced(cluster_type, chain);
CREATE INDEX IF NOT EXISTS idx_coverage_metrics_chain_window ON coverage_metrics(chain, window_hours);
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint_timestamp ON api_performance_metrics(endpoint, timestamp DESC);

-- 11. Refresh Functions
CREATE OR REPLACE FUNCTION refresh_market_hub_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW chain_features_24h;
  REFRESH MATERIALIZED VIEW chain_risk_today;
  REFRESH MATERIALIZED VIEW chain_risk_history;
  REFRESH MATERIALIZED VIEW chain_risk_normalized;
  REFRESH MATERIALIZED VIEW cluster_chain_correlation_hourly;
END;
$$ LANGUAGE plpgsql;

-- 12. Auto-refresh trigger (every 15 minutes)
CREATE OR REPLACE FUNCTION schedule_view_refresh()
RETURNS void AS $$
BEGIN
  -- This would be called by a cron job
  PERFORM refresh_market_hub_views();
  
  -- Update coverage metrics
  INSERT INTO coverage_metrics (chain, window_hours, whale_count, tx_count, volume_usd, coverage_percentage, quality_score)
  SELECT 
    chain,
    24 as window_hours,
    whale_count,
    tx_count,
    ABS(net_flow) as volume_usd,
    CASE 
      WHEN whale_count >= 3 AND tx_count >= 50 AND ABS(net_flow) >= 1000000 THEN 100.0
      WHEN whale_count >= 2 AND tx_count >= 25 THEN 75.0
      WHEN whale_count >= 1 AND tx_count >= 10 THEN 50.0
      ELSE 25.0
    END as coverage_percentage,
    CASE 
      WHEN whale_count >= 3 AND tx_count >= 50 THEN 95
      WHEN whale_count >= 2 AND tx_count >= 25 THEN 80
      WHEN whale_count >= 1 AND tx_count >= 10 THEN 60
      ELSE 30
    END as quality_score
  FROM chain_features_24h
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 13. RLS Policies
ALTER TABLE whale_clusters_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_classification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to whale_clusters_enhanced" ON whale_clusters_enhanced FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to alert_classification_rules" ON alert_classification_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to coverage_metrics" ON coverage_metrics FOR SELECT TO authenticated USING (true);

-- Service role can manage all data
CREATE POLICY "Service role full access whale_clusters_enhanced" ON whale_clusters_enhanced FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access alert_classification_rules" ON alert_classification_rules FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access coverage_metrics" ON coverage_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access api_performance_metrics" ON api_performance_metrics FOR ALL TO service_role USING (true);

-- 14. Initial data refresh
SELECT refresh_market_hub_views();