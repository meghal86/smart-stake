-- Performance optimization indexes for whale alerts
CREATE INDEX IF NOT EXISTS idx_alerts_amount_timestamp ON alerts(amount_usd DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_chain_type ON alerts(chain, tx_type);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_tx_hash ON alerts(tx_hash);

-- Data quality monitoring table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  api_source TEXT NOT NULL,
  success_rate DECIMAL(5,2),
  avg_response_time INTEGER,
  error_count INTEGER,
  total_requests INTEGER
);

-- User preferences for customization
CREATE TABLE IF NOT EXISTS user_whale_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  min_amount_usd DECIMAL DEFAULT 1000000,
  preferred_chains TEXT[] DEFAULT ARRAY['ethereum'],
  exclude_exchanges BOOLEAN DEFAULT FALSE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_whale_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own preferences" ON user_whale_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage data quality" ON data_quality_metrics
  FOR ALL USING (auth.role() = 'service_role');