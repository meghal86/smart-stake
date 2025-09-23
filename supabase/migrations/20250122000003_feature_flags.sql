-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read feature flags" ON feature_flags FOR SELECT USING (true);

-- Insert default feature flags
INSERT INTO feature_flags (key, enabled, config) VALUES
('custom_kpi_cards', false, '{}'),
('advanced_analytics', true, '{}'),
('mobile_drawer', true, '{}')
ON CONFLICT (key) DO NOTHING;