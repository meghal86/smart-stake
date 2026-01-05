-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  user_tier TEXT,
  asset TEXT,
  timeframe TEXT,
  model_version TEXT,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tier ON analytics_events(user_tier, created_at);

-- Preset to upgrade conversion view
CREATE OR REPLACE VIEW v_preset_to_upgrade AS
WITH preset_clicks AS (
  SELECT 
    user_id,
    properties->>'preset_name' as preset_name,
    created_at as clicked_at
  FROM analytics_events 
  WHERE event_name = 'preset_clicked'
    AND created_at >= NOW() - INTERVAL '30 days'
),
upgrades AS (
  SELECT 
    user_id,
    created_at as upgraded_at
  FROM analytics_events 
  WHERE event_name = 'upgrade_clicked'
    AND created_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  p.preset_name,
  COUNT(p.user_id) as total_clicks,
  COUNT(u.user_id) as upgrades_within_72h,
  ROUND(COUNT(u.user_id)::numeric / COUNT(p.user_id) * 100, 2) as conversion_rate
FROM preset_clicks p
LEFT JOIN upgrades u ON p.user_id = u.user_id 
  AND u.upgraded_at BETWEEN p.clicked_at AND p.clicked_at + INTERVAL '72 hours'
GROUP BY p.preset_name
ORDER BY conversion_rate DESC;

-- Feature lock to upgrade conversion view
CREATE OR REPLACE VIEW v_lock_to_upgrade AS
WITH feature_locks AS (
  SELECT 
    user_id,
    properties->>'feature' as feature_name,
    created_at as locked_at
  FROM analytics_events 
  WHERE event_name = 'feature_locked_view'
    AND created_at >= NOW() - INTERVAL '30 days'
),
upgrades AS (
  SELECT 
    user_id,
    created_at as upgraded_at
  FROM analytics_events 
  WHERE event_name = 'upgrade_clicked'
    AND created_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  f.feature_name,
  COUNT(f.user_id) as total_locks,
  COUNT(u.user_id) as upgrades_within_24h,
  ROUND(COUNT(u.user_id)::numeric / COUNT(f.user_id) * 100, 2) as conversion_rate
FROM feature_locks f
LEFT JOIN upgrades u ON f.user_id = u.user_id 
  AND u.upgraded_at BETWEEN f.locked_at AND f.locked_at + INTERVAL '24 hours'
GROUP BY f.feature_name
ORDER BY conversion_rate DESC;

-- User cohorts view
CREATE OR REPLACE VIEW v_user_cohorts AS
WITH weekly_cohorts AS (
  SELECT 
    id as user_id,
    DATE_TRUNC('week', created_at) as cohort_week
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '12 weeks'
),
scenario_activity AS (
  SELECT 
    user_id,
    COUNT(*) as scenarios_run,
    MIN(created_at) as first_scenario,
    DATE_TRUNC('week', MIN(created_at)) as activity_week
  FROM analytics_events 
  WHERE event_name = 'scenario_run'
    AND created_at >= NOW() - INTERVAL '12 weeks'
  GROUP BY user_id
),
cohort_metrics AS (
  SELECT 
    c.cohort_week,
    COUNT(c.user_id) as total_users,
    COUNT(CASE 
      WHEN s.scenarios_run >= 3 
      AND s.first_scenario <= c.cohort_week + INTERVAL '7 days'
      THEN 1 
    END) as active_users
  FROM weekly_cohorts c
  LEFT JOIN scenario_activity s ON c.user_id = s.user_id
  GROUP BY c.cohort_week
)
SELECT 
  cohort_week,
  total_users,
  active_users,
  ROUND(active_users::numeric / NULLIF(total_users, 0) * 100, 2) as retention_rate
FROM cohort_metrics
ORDER BY cohort_week DESC;

-- Daily runs by tier view
CREATE OR REPLACE VIEW v_daily_runs_by_tier AS
SELECT 
  DATE(created_at) as day,
  user_tier,
  COUNT(*) as total_runs,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT user_id), 2) as runs_per_user
FROM analytics_events 
WHERE event_name = 'scenario_run'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND user_tier IS NOT NULL
GROUP BY DATE(created_at), user_tier
ORDER BY day DESC, user_tier;

-- RLS policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events" ON analytics_events 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages all analytics" ON analytics_events 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can read analytics" ON analytics_events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );