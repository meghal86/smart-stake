-- Drift monitoring and model metrics

CREATE TABLE IF NOT EXISTS model_daily_metrics (
  day DATE NOT NULL,
  model_version TEXT NOT NULL,
  hit_rate_7d NUMERIC,
  hit_rate_30d NUMERIC,
  hit_rate_90d NUMERIC,
  avg_confidence NUMERIC,
  runs INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (day, model_version)
);

-- Baseline metrics for comparison
ALTER TABLE model_versions 
  ADD COLUMN IF NOT EXISTS baseline_hit_rate_30d NUMERIC DEFAULT 0.72;

-- Drift alerts tracking
CREATE TABLE IF NOT EXISTS drift_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'hit_rate_drop', 'confidence_drop'
  current_value NUMERIC,
  baseline_value NUMERIC,
  delta NUMERIC,
  consecutive_days INT DEFAULT 1,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_daily_metrics_day ON model_daily_metrics(day DESC);
CREATE INDEX IF NOT EXISTS idx_model_daily_metrics_version ON model_daily_metrics(model_version, day DESC);
CREATE INDEX IF NOT EXISTS idx_drift_alerts_unresolved ON drift_alerts(model_version, created_at) WHERE resolved_at IS NULL;

-- RLS policies
ALTER TABLE model_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read model metrics" ON model_daily_metrics FOR SELECT USING (true);
CREATE POLICY "Service role manages metrics" ON model_daily_metrics FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages alerts" ON drift_alerts FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');