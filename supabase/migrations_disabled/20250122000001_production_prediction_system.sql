-- Production Prediction System Schema
-- Institutional-grade tables with proper indexing and RLS

-- Feature store for ML features
CREATE TABLE IF NOT EXISTS feature_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset TEXT NOT NULL,
  chain TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_value NUMERIC NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset, chain, feature_name, window_start)
);

-- Model registry for version control
CREATE TABLE IF NOT EXISTS model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('free', 'pro', 'premium', 'enterprise')),
  is_active BOOLEAN DEFAULT false,
  accuracy_7d NUMERIC,
  accuracy_30d NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, model_version)
);

-- Prediction accuracy tracking
CREATE TABLE IF NOT EXISTS prediction_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id TEXT NOT NULL,
  asset TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  predicted_value NUMERIC,
  realized_value NUMERIC,
  was_correct BOOLEAN,
  accuracy_score NUMERIC,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data provider health monitoring
CREATE TABLE IF NOT EXISTS provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('healthy', 'degraded', 'down')),
  last_success TIMESTAMPTZ,
  error_rate NUMERIC DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature importance tracking
CREATE TABLE IF NOT EXISTS feature_importance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  importance_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data drift monitoring
CREATE TABLE IF NOT EXISTS data_drift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  drift_score NUMERIC NOT NULL,
  drift_type TEXT CHECK (drift_type IN ('psi', 'ks', 'wasserstein')),
  threshold_exceeded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prediction calibration tracking
CREATE TABLE IF NOT EXISTS prediction_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  confidence_bucket NUMERIC NOT NULL,
  predicted_probability NUMERIC NOT NULL,
  actual_frequency NUMERIC NOT NULL,
  sample_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_feature_store_asset_time ON feature_store(asset, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_asset ON prediction_accuracy(asset, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_health_name ON provider_health(provider_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_drift_feature ON data_drift(feature_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON admin_audit(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE feature_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_importance ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_drift ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_calibration ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read access" ON feature_store FOR SELECT USING (true);
CREATE POLICY "Public read access" ON model_registry FOR SELECT USING (true);
CREATE POLICY "Public read access" ON prediction_accuracy FOR SELECT USING (true);
CREATE POLICY "Admin only" ON provider_health FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin only" ON admin_audit FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Public read access" ON feature_importance FOR SELECT USING (true);
CREATE POLICY "Public read access" ON data_drift FOR SELECT USING (true);
CREATE POLICY "Public read access" ON prediction_calibration FOR SELECT USING (true);