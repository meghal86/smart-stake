-- Attribution logging and segmentation for BI dashboard

-- Event tables for attribution tracking
CREATE TABLE IF NOT EXISTS preset_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  preset_key TEXT NOT NULL,
  asset TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_lock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  lock_key TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upgrade_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  new_tier TEXT NOT NULL,
  last_preset_key TEXT,
  last_lock_key TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_preset_clicks_user_time ON preset_click_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_locks_user_time ON feature_lock_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_upgrades_user_time ON upgrade_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_preset_clicks_time ON preset_click_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_locks_time ON feature_lock_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_upgrades_time ON upgrade_events(occurred_at DESC);

-- Attribution trigger function
CREATE OR REPLACE FUNCTION fill_upgrade_attribution()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Last preset click within 72h
  SELECT p.preset_key INTO NEW.last_preset_key
  FROM preset_click_events p
  WHERE p.user_id = NEW.user_id
    AND p.occurred_at >= NEW.occurred_at - INTERVAL '72 hours'
  ORDER BY p.occurred_at DESC LIMIT 1;

  -- Last lock within 24h
  SELECT l.lock_key INTO NEW.last_lock_key
  FROM feature_lock_events l
  WHERE l.user_id = NEW.user_id
    AND l.occurred_at >= NEW.occurred_at - INTERVAL '24 hours'
  ORDER BY l.occurred_at DESC LIMIT 1;

  RETURN NEW;
END $$;

-- Attribution trigger
DROP TRIGGER IF EXISTS trg_fill_upgrade_attr ON upgrade_events;
CREATE TRIGGER trg_fill_upgrade_attr
  BEFORE INSERT ON upgrade_events
  FOR EACH ROW EXECUTE FUNCTION fill_upgrade_attribution();

-- Enhanced attribution views with filtering support
CREATE OR REPLACE VIEW v_preset_to_upgrade_filtered AS
SELECT
  preset_key,
  COUNT(*) FILTER (WHERE upgraded) as upgrades,
  COUNT(*) as clicks,
  ROUND(100.0 * COUNT(*) FILTER (WHERE upgraded) / NULLIF(COUNT(*), 0), 2) as conversion_pct
FROM (
  SELECT
    p.user_id, 
    p.preset_key,
    p.asset,
    p.occurred_at,
    u.raw_user_meta_data->>'tier' as user_tier,
    EXISTS(
      SELECT 1 FROM upgrade_events ue
      WHERE ue.user_id = p.user_id
        AND ue.occurred_at BETWEEN p.occurred_at AND p.occurred_at + INTERVAL '72 hours'
    ) as upgraded
  FROM preset_click_events p
  LEFT JOIN auth.users u ON p.user_id = u.id
) t
GROUP BY preset_key
ORDER BY conversion_pct DESC NULLS LAST;

CREATE OR REPLACE VIEW v_lock_to_upgrade_filtered AS
SELECT
  lock_key,
  COUNT(*) FILTER (WHERE upgraded) as upgrades,
  COUNT(*) as views,
  ROUND(100.0 * COUNT(*) FILTER (WHERE upgraded) / NULLIF(COUNT(*), 0), 2) as conversion_pct
FROM (
  SELECT
    l.user_id, 
    l.lock_key,
    l.occurred_at,
    u.raw_user_meta_data->>'tier' as user_tier,
    EXISTS(
      SELECT 1 FROM upgrade_events ue
      WHERE ue.user_id = l.user_id
        AND ue.occurred_at BETWEEN l.occurred_at AND l.occurred_at + INTERVAL '24 hours'
    ) as upgraded
  FROM feature_lock_events l
  LEFT JOIN auth.users u ON l.user_id = u.id
) t
GROUP BY lock_key
ORDER BY conversion_pct DESC NULLS LAST;

CREATE OR REPLACE VIEW v_cross_retention_upgrades_filtered AS
WITH runs AS (
  SELECT 
    sr.user_id, 
    COUNT(*) as run_count,
    u.raw_user_meta_data->>'tier' as user_tier,
    sr.inputs->>'asset' as asset
  FROM scenario_runs sr
  LEFT JOIN auth.users u ON sr.user_id = u.id
  WHERE sr.created_at >= NOW() - INTERVAL '90 days'
  GROUP BY sr.user_id, u.raw_user_meta_data->>'tier', sr.inputs->>'asset'
),
bucketed AS (
  SELECT 
    user_id,
    user_tier,
    asset,
    CASE
      WHEN run_count <= 2 THEN '0-2'
      WHEN run_count <= 5 THEN '3-5'
      ELSE '6+'
    END as bucket
  FROM runs
),
upgrades AS (
  SELECT user_id, MIN(occurred_at) as upgraded_at
  FROM upgrade_events
  WHERE occurred_at >= NOW() - INTERVAL '90 days'
  GROUP BY user_id
)
SELECT 
  b.bucket,
  b.user_tier,
  b.asset,
  COUNT(*) as users,
  COUNT(u.user_id) as upgrades,
  ROUND(100.0 * COUNT(u.user_id) / NULLIF(COUNT(*), 0), 2) as upgrade_pct
FROM bucketed b
LEFT JOIN upgrades u USING (user_id)
GROUP BY b.bucket, b.user_tier, b.asset
ORDER BY CASE b.bucket WHEN '0-2' THEN 1 WHEN '3-5' THEN 2 ELSE 3 END;

CREATE OR REPLACE VIEW v_bi_kpis_filtered AS
SELECT
  (SELECT COUNT(*) FROM preset_click_events WHERE occurred_at >= NOW() - INTERVAL '30 days') as preset_clicks_30d,
  (SELECT COUNT(*) FROM feature_lock_events WHERE occurred_at >= NOW() - INTERVAL '30 days') as lock_views_30d,
  (SELECT COUNT(*) FROM scenario_runs WHERE created_at >= NOW() - INTERVAL '30 days') as runs_30d,
  (SELECT COUNT(*) FROM upgrade_events WHERE occurred_at >= NOW() - INTERVAL '30 days') as upgrades_30d;

-- RLS policies
ALTER TABLE preset_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_lock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own preset clicks" ON preset_click_events 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature locks" ON feature_lock_events 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages upgrade events" ON upgrade_events 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can read all attribution events" ON preset_click_events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can read all lock events" ON feature_lock_events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can read all upgrade events" ON upgrade_events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );