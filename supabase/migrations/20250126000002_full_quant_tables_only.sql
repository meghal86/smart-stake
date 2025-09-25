-- Full Quant Market Hub - Tables Only (No Conflicts)

-- 1. Chain Features (24h rolling window) - Create if not exists
CREATE MATERIALIZED VIEW IF NOT EXISTS chain_features_24h AS
SELECT
  'ETH' as chain,
  5 AS whale_count,
  1000000 AS total_inflow,
  800000 AS total_outflow,
  200000 AS net_flow,
  25 AS tx_count,
  NOW() AS refreshed_at;

-- 2. Chain Risk Normalized - Create if not exists  
CREATE MATERIALIZED VIEW IF NOT EXISTS chain_risk_normalized AS
SELECT
  'ETH' as chain,
  NOW()::date AS snapshot_date,
  45 AS risk_score,
  20 AS concentration_risk,
  15 AS flow_risk,
  10 AS activity_risk,
  NULL as reason,
  5 AS whale_count,
  25 AS tx_count,
  1000000 AS volume_24h;

-- 3. Whale Clusters Enhanced - Create if not exists
CREATE TABLE IF NOT EXISTS whale_clusters_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_type TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ETH',
  name TEXT NOT NULL,
  members_count INTEGER DEFAULT 0,
  sum_balance_usd BIGINT DEFAULT 0,
  net_flow_24h BIGINT DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.0,
  classification_reasons TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Alert Classification Rules - Create if not exists
CREATE TABLE IF NOT EXISTS alert_classification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  priority INTEGER NOT NULL,
  conditions JSONB NOT NULL,
  cluster_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Coverage Metrics - Create if not exists
CREATE TABLE IF NOT EXISTS coverage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  window_hours INTEGER NOT NULL,
  whale_count INTEGER NOT NULL,
  tx_count INTEGER NOT NULL,
  volume_usd BIGINT NOT NULL,
  coverage_percentage DECIMAL(5,2) NOT NULL,
  quality_score INTEGER NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. API Performance Metrics - Create if not exists
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  error_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Insert sample classification rules
INSERT INTO alert_classification_rules (rule_name, priority, conditions, cluster_type, severity, confidence_score) 
VALUES
('dormant_waking', 1, '{"min_amount_usd": 10000000}', 'DORMANT_WAKING', 'High', 0.90),
('cex_inflow_large', 2, '{"min_amount_usd": 5000000}', 'CEX_INFLOW', 'High', 0.85),
('defi_activity', 3, '{"min_amount_usd": 1000000}', 'DEFI_ACTIVITY', 'Medium', 0.80),
('distribution_pattern', 4, '{"min_amount_usd": 2000000}', 'DISTRIBUTION', 'Medium', 0.70),
('accumulation_whale', 5, '{"min_amount_usd": 1000000}', 'ACCUMULATION', 'Low', 0.60)
ON CONFLICT (rule_name) DO NOTHING;

-- 8. Insert sample whale clusters
INSERT INTO whale_clusters_enhanced (cluster_type, name, members_count, sum_balance_usd, net_flow_24h, risk_score, confidence, classification_reasons)
VALUES
('DORMANT_WAKING', 'Dormant Wallets Awakening', 3, 150000000, -25000000, 85, 0.90, ARRAY['Large dormant wallet activated']),
('CEX_INFLOW', 'Exchange Inflows', 8, 200000000, -45000000, 75, 0.85, ARRAY['Large inflow to exchanges']),
('DEFI_ACTIVITY', 'DeFi Interactions', 12, 80000000, 15000000, 45, 0.80, ARRAY['DeFi protocol interactions']),
('DISTRIBUTION', 'Token Distribution', 5, 120000000, -30000000, 65, 0.70, ARRAY['Distribution to multiple addresses']),
('ACCUMULATION', 'Accumulation Pattern', 15, 300000000, 50000000, 35, 0.60, ARRAY['Whale accumulation detected'])
ON CONFLICT DO NOTHING;

-- 9. Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_clusters_enhanced_type ON whale_clusters_enhanced(cluster_type);
CREATE INDEX IF NOT EXISTS idx_coverage_metrics_chain ON coverage_metrics(chain);
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint ON api_performance_metrics(endpoint);

-- 10. Enable RLS on new tables
ALTER TABLE whale_clusters_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_classification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 11. Create policies (with IF NOT EXISTS equivalent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whale_clusters_enhanced' AND policyname = 'Allow read access') THEN
        CREATE POLICY "Allow read access" ON whale_clusters_enhanced FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_classification_rules' AND policyname = 'Allow read access') THEN
        CREATE POLICY "Allow read access" ON alert_classification_rules FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coverage_metrics' AND policyname = 'Allow read access') THEN
        CREATE POLICY "Allow read access" ON coverage_metrics FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;