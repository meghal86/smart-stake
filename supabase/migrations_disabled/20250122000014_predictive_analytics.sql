-- Predictive analytics for upgrade forecasting

-- Cross retention upgrades view
CREATE OR REPLACE VIEW v_cross_retention_upgrades AS
WITH user_week1_activity AS (
  SELECT 
    u.id as user_id,
    u.created_at as signup_date,
    COUNT(ae.id) as scenarios_week1,
    CASE 
      WHEN COUNT(ae.id) = 0 THEN '0-2 runs'
      WHEN COUNT(ae.id) BETWEEN 1 AND 2 THEN '0-2 runs'
      WHEN COUNT(ae.id) BETWEEN 3 AND 5 THEN '3-5 runs'
      ELSE '6+ runs'
    END as activity_bucket
  FROM auth.users u
  LEFT JOIN analytics_events ae ON u.id = ae.user_id 
    AND ae.event_name = 'scenario_run'
    AND ae.created_at BETWEEN u.created_at AND u.created_at + INTERVAL '7 days'
  WHERE u.created_at >= NOW() - INTERVAL '8 weeks'
  GROUP BY u.id, u.created_at
),
upgrades AS (
  SELECT DISTINCT user_id, MIN(created_at) as first_upgrade
  FROM analytics_events 
  WHERE event_name = 'upgrade_clicked'
  GROUP BY user_id
)
SELECT 
  activity_bucket,
  COUNT(ua.user_id) as total_users,
  COUNT(up.user_id) as upgraded_users,
  ROUND(COUNT(up.user_id)::numeric / COUNT(ua.user_id) * 100, 2) as upgrade_probability
FROM user_week1_activity ua
LEFT JOIN upgrades up ON ua.user_id = up.user_id
GROUP BY activity_bucket
ORDER BY 
  CASE activity_bucket 
    WHEN '0-2 runs' THEN 1
    WHEN '3-5 runs' THEN 2
    WHEN '6+ runs' THEN 3
  END;

-- Upgrade forecasts table
CREATE TABLE IF NOT EXISTS upgrade_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  preset_name TEXT,
  user_tier TEXT,
  run_count_bucket TEXT,
  predicted_upgrade_rate NUMERIC NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5,
  sample_size INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_forecasts_date ON upgrade_forecasts(forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_upgrade_forecasts_preset ON upgrade_forecasts(preset_name, forecast_date DESC);

-- Forecast accuracy tracking
CREATE TABLE IF NOT EXISTS forecast_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  preset_name TEXT,
  predicted_rate NUMERIC NOT NULL,
  actual_rate NUMERIC NOT NULL,
  accuracy_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training data view for ML model
CREATE OR REPLACE VIEW v_upgrade_training_data AS
WITH user_features AS (
  SELECT 
    ae.user_id,
    ae.user_tier,
    ae.properties->>'preset_name' as preset_name,
    COUNT(CASE WHEN ae.event_name = 'preset_clicked' THEN 1 END) as preset_clicks,
    COUNT(CASE WHEN ae.event_name = 'scenario_saved' THEN 1 END) as scenarios_saved,
    COUNT(CASE WHEN ae.event_name = 'scenario_run' THEN 1 END) as scenarios_run,
    COUNT(CASE WHEN ae.event_name = 'feature_locked_view' THEN 1 END) as feature_locks,
    MIN(ae.created_at) as first_activity
  FROM analytics_events ae
  WHERE ae.created_at >= NOW() - INTERVAL '60 days'
    AND ae.user_tier IS NOT NULL
  GROUP BY ae.user_id, ae.user_tier, ae.properties->>'preset_name'
),
upgrades AS (
  SELECT 
    user_id,
    MIN(created_at) as upgrade_date
  FROM analytics_events 
  WHERE event_name = 'upgrade_clicked'
  GROUP BY user_id
)
SELECT 
  uf.*,
  CASE 
    WHEN uf.scenarios_run <= 2 THEN '0-2'
    WHEN uf.scenarios_run <= 5 THEN '3-5'
    ELSE '6+'
  END as run_count_bucket,
  CASE WHEN up.user_id IS NOT NULL THEN 1 ELSE 0 END as upgraded,
  EXTRACT(EPOCH FROM (COALESCE(up.upgrade_date, NOW()) - uf.first_activity)) / 86400 as days_to_upgrade
FROM user_features uf
LEFT JOIN upgrades up ON uf.user_id = up.user_id 
  AND up.upgrade_date >= uf.first_activity;

-- RLS policies
ALTER TABLE upgrade_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_accuracy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read forecasts" ON upgrade_forecasts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Service role manages forecasts" ON upgrade_forecasts FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role manages accuracy" ON forecast_accuracy FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');