-- Full Quant Market Hub - Live Data Only (Fixed Column Names)

-- 1. Chain Features (24h rolling window) - Real data from alerts table
CREATE MATERIALIZED VIEW IF NOT EXISTS chain_features_24h AS
SELECT
  COALESCE(chain, 'UNKNOWN') as chain,
  COUNT(DISTINCT from_addr) AS whale_count,
  SUM(CASE WHEN amount_usd > 0 THEN amount_usd ELSE 0 END) AS total_inflow,
  SUM(CASE WHEN amount_usd < 0 THEN ABS(amount_usd) ELSE 0 END) AS total_outflow,
  SUM(amount_usd) AS net_flow,
  COUNT(*) AS tx_count,
  MAX(created_at) AS refreshed_at
FROM alerts
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND amount_usd IS NOT NULL
  AND amount_usd > 0
GROUP BY chain
HAVING COUNT(*) > 0;

-- 2. Chain Risk Normalized - Real calculation from live data
CREATE MATERIALIZED VIEW IF NOT EXISTS chain_risk_normalized AS
SELECT
  cf.chain,
  NOW()::date AS snapshot_date,
  -- Real risk calculation
  LEAST(100, GREATEST(0, 
    ROUND((cf.whale_count::float / NULLIF(totals.total_whales, 0)) * 40 +
          (ABS(cf.net_flow)::float / NULLIF(totals.total_flow, 0)) * 35 +
          (cf.tx_count::float / NULLIF(totals.max_tx, 1)) * 25)
  )) AS risk_score,
  LEAST(100, GREATEST(0, (cf.whale_count::float / NULLIF(totals.total_whales, 0)) * 100)) AS concentration_risk,
  LEAST(100, GREATEST(0, (ABS(cf.net_flow)::float / NULLIF(totals.total_flow, 0)) * 100)) AS flow_risk,
  LEAST(100, GREATEST(0, (cf.tx_count::float / NULLIF(totals.max_tx, 1)) * 100)) AS activity_risk,
  CASE 
    WHEN cf.whale_count < 3 THEN 'insufficient_data'
    WHEN cf.tx_count < 10 THEN 'low_activity'
    WHEN ABS(cf.net_flow) < 100000 THEN 'low_volume'
    ELSE NULL
  END as reason,
  cf.whale_count,
  cf.tx_count,
  ABS(cf.net_flow) AS volume_24h
FROM chain_features_24h cf
CROSS JOIN (
  SELECT 
    SUM(whale_count) AS total_whales,
    SUM(ABS(net_flow)) AS total_flow,
    MAX(tx_count) AS max_tx
  FROM chain_features_24h
) totals;

-- 3. Whale Clusters Enhanced - Live data only
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

-- 4. Alert Classification Rules - Configuration only
CREATE TABLE IF NOT EXISTS alert_classification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  priority INTEGER NOT NULL,
  conditions JSONB NOT NULL,
  cluster_type TEXT NOT NULL CHECK (cluster_type IN ('DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION')),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Coverage Metrics - Live calculation only
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

-- 6. API Performance Metrics - Live tracking only
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  error_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Correlation Analysis - Live data only
CREATE MATERIALIZED VIEW IF NOT EXISTS cluster_chain_correlation_hourly AS
SELECT
  a.chain,
  'LIVE_CLUSTER' as cluster_type,
  DATE_TRUNC('hour', a.created_at) AS hour,
  SUM(a.amount_usd) AS chain_flow,
  COUNT(*) AS tx_count,
  AVG(a.amount_usd) AS avg_tx_size
FROM alerts a
WHERE a.created_at >= NOW() - INTERVAL '7 days'
  AND a.amount_usd IS NOT NULL
  AND a.amount_usd > 0
GROUP BY a.chain, DATE_TRUNC('hour', a.created_at)
HAVING COUNT(*) > 0;

-- 8. Insert ONLY essential classification rules (configuration, not data)
INSERT INTO alert_classification_rules (rule_name, priority, conditions, cluster_type, severity, confidence_score) 
VALUES
('dormant_waking', 1, '{"min_amount_usd": 10000000, "dormant_days": 30}', 'DORMANT_WAKING', 'High', 0.90),
('cex_inflow_large', 2, '{"min_amount_usd": 5000000, "to_entity_type": "cex"}', 'CEX_INFLOW', 'High', 0.85),
('defi_activity', 3, '{"min_amount_usd": 1000000, "has_defi_tags": true}', 'DEFI_ACTIVITY', 'Medium', 0.80),
('distribution_pattern', 4, '{"min_amount_usd": 2000000, "to_entity_type": "unknown", "tx_count_24h": 5}', 'DISTRIBUTION', 'Medium', 0.70),
('accumulation_whale', 5, '{"min_amount_usd": 1000000}', 'ACCUMULATION', 'Low', 0.60)
ON CONFLICT (rule_name) DO NOTHING;

-- 9. Performance indexes
CREATE INDEX IF NOT EXISTS idx_alerts_created_at_chain ON alerts(created_at DESC, chain) WHERE amount_usd > 0;
CREATE INDEX IF NOT EXISTS idx_alerts_amount_usd_desc ON alerts(amount_usd DESC) WHERE amount_usd > 0;
CREATE INDEX IF NOT EXISTS idx_whale_clusters_enhanced_type_chain ON whale_clusters_enhanced(cluster_type, chain);
CREATE INDEX IF NOT EXISTS idx_coverage_metrics_chain_window ON coverage_metrics(chain, window_hours);
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint_timestamp ON api_performance_metrics(endpoint, timestamp DESC);

-- 10. Enable RLS
ALTER TABLE whale_clusters_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_classification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies
DO $$
BEGIN
    -- Read access for authenticated users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whale_clusters_enhanced' AND policyname = 'Allow read access to whale clusters') THEN
        CREATE POLICY "Allow read access to whale clusters" ON whale_clusters_enhanced FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_classification_rules' AND policyname = 'Allow read access to classification rules') THEN
        CREATE POLICY "Allow read access to classification rules" ON alert_classification_rules FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coverage_metrics' AND policyname = 'Allow read access to coverage metrics') THEN
        CREATE POLICY "Allow read access to coverage metrics" ON coverage_metrics FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- Service role full access
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whale_clusters_enhanced' AND policyname = 'Service role full access whale clusters') THEN
        CREATE POLICY "Service role full access whale clusters" ON whale_clusters_enhanced FOR ALL TO service_role USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_classification_rules' AND policyname = 'Service role full access classification rules') THEN
        CREATE POLICY "Service role full access classification rules" ON alert_classification_rules FOR ALL TO service_role USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coverage_metrics' AND policyname = 'Service role full access coverage metrics') THEN
        CREATE POLICY "Service role full access coverage metrics" ON coverage_metrics FOR ALL TO service_role USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_performance_metrics' AND policyname = 'Service role full access api metrics') THEN
        CREATE POLICY "Service role full access api metrics" ON api_performance_metrics FOR ALL TO service_role USING (true);
    END IF;
END
$$;

-- 12. Refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_market_hub_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW chain_features_24h;
  REFRESH MATERIALIZED VIEW chain_risk_normalized;
  REFRESH MATERIALIZED VIEW cluster_chain_correlation_hourly;
END;
$$ LANGUAGE plpgsql;

-- 13. Auto-refresh trigger function
CREATE OR REPLACE FUNCTION schedule_view_refresh()
RETURNS void AS $$
BEGIN
  -- Refresh materialized views
  PERFORM refresh_market_hub_views();
  
  -- Update coverage metrics from live data only
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
  WHERE whale_count > 0 AND tx_count > 0;
END;
$$ LANGUAGE plpgsql;