-- Generate test data for BI dashboard
-- Run this in Supabase SQL Editor to populate analytics

-- 1. Create test users
INSERT INTO auth.users (id, email, created_at, raw_user_meta_data) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com', NOW() - INTERVAL '14 days', '{"role": "user"}'),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', NOW() - INTERVAL '12 days', '{"role": "user"}'),
  ('33333333-3333-3333-3333-333333333333', 'test3@example.com', NOW() - INTERVAL '10 days', '{"role": "user"}'),
  ('44444444-4444-4444-4444-444444444444', 'test4@example.com', NOW() - INTERVAL '8 days', '{"role": "user"}'),
  ('55555555-5555-5555-5555-555555555555', 'test5@example.com', NOW() - INTERVAL '6 days', '{"role": "user"}')
ON CONFLICT (id) DO NOTHING;

-- 2. Generate preset clicks and scenario runs
INSERT INTO analytics_events (user_id, event_name, user_tier, asset, timeframe, model_version, properties, created_at) VALUES
  -- User 1: Heavy user, upgrades
  ('11111111-1111-1111-1111-111111111111', 'preset_clicked', 'free', 'ETH', '6h', 'scn-v1.0', '{"preset_name": "CEX Inflows Spike"}', NOW() - INTERVAL '14 days'),
  ('11111111-1111-1111-1111-111111111111', 'scenario_run', 'free', 'ETH', '6h', 'scn-v1.0', '{"asset": "ETH"}', NOW() - INTERVAL '14 days'),
  ('11111111-1111-1111-1111-111111111111', 'scenario_run', 'free', 'ETH', '24h', 'scn-v1.0', '{"asset": "ETH"}', NOW() - INTERVAL '13 days'),
  ('11111111-1111-1111-1111-111111111111', 'scenario_saved', 'free', 'ETH', '6h', 'scn-v1.0', '{"name": "My ETH Analysis"}', NOW() - INTERVAL '13 days'),
  ('11111111-1111-1111-1111-111111111111', 'feature_locked_view', 'free', 'ETH', '6h', 'scn-v1.0', '{"feature": "export"}', NOW() - INTERVAL '12 days'),
  ('11111111-1111-1111-1111-111111111111', 'upgrade_clicked', 'free', 'ETH', '6h', 'scn-v1.0', '{"from_tier": "free", "to_tier": "pro"}', NOW() - INTERVAL '12 days'),
  
  -- User 2: Moderate user, upgrades later
  ('22222222-2222-2222-2222-222222222222', 'preset_clicked', 'free', 'BTC', '24h', 'scn-v1.0', '{"preset_name": "Accumulation Cluster"}', NOW() - INTERVAL '12 days'),
  ('22222222-2222-2222-2222-222222222222', 'scenario_run', 'free', 'BTC', '24h', 'scn-v1.0', '{"asset": "BTC"}', NOW() - INTERVAL '12 days'),
  ('22222222-2222-2222-2222-222222222222', 'scenario_run', 'free', 'BTC', '6h', 'scn-v1.0', '{"asset": "BTC"}', NOW() - INTERVAL '11 days'),
  ('22222222-2222-2222-2222-222222222222', 'feature_locked_view', 'free', 'BTC', '6h', 'scn-v1.0', '{"feature": "backtests"}', NOW() - INTERVAL '10 days'),
  ('22222222-2222-2222-2222-222222222222', 'upgrade_clicked', 'free', 'BTC', '6h', 'scn-v1.0', '{"from_tier": "free", "to_tier": "premium"}', NOW() - INTERVAL '9 days'),
  
  -- User 3: Light user, no upgrade
  ('33333333-3333-3333-3333-333333333333', 'preset_clicked', 'free', 'ETH', '2h', 'scn-v1.0', '{"preset_name": "Distribution Wave"}', NOW() - INTERVAL '10 days'),
  ('33333333-3333-3333-3333-333333333333', 'scenario_run', 'free', 'ETH', '2h', 'scn-v1.0', '{"asset": "ETH"}', NOW() - INTERVAL '10 days'),
  ('33333333-3333-3333-3333-333333333333', 'feature_locked_view', 'free', 'ETH', '2h', 'scn-v1.0', '{"feature": "export"}', NOW() - INTERVAL '9 days'),
  
  -- User 4: Pro user, active
  ('44444444-4444-4444-4444-444444444444', 'preset_clicked', 'pro', 'ETH', '6h', 'scn-v1.0', '{"preset_name": "CEX Inflows Spike"}', NOW() - INTERVAL '8 days'),
  ('44444444-4444-4444-4444-444444444444', 'scenario_run', 'pro', 'ETH', '6h', 'scn-v1.0', '{"asset": "ETH"}', NOW() - INTERVAL '8 days'),
  ('44444444-4444-4444-4444-444444444444', 'scenario_saved', 'pro', 'ETH', '6h', 'scn-v1.0', '{"name": "Pro Analysis"}', NOW() - INTERVAL '7 days'),
  ('44444444-4444-4444-4444-444444444444', 'export_success', 'pro', 'ETH', '6h', 'scn-v1.0', '{"format": "csv"}', NOW() - INTERVAL '7 days'),
  
  -- User 5: Recent user, multiple runs
  ('55555555-5555-5555-5555-555555555555', 'preset_clicked', 'free', 'SOL', '6h', 'scn-v1.0', '{"preset_name": "Whale Accumulation"}', NOW() - INTERVAL '6 days'),
  ('55555555-5555-5555-5555-555555555555', 'scenario_run', 'free', 'SOL', '6h', 'scn-v1.0', '{"asset": "SOL"}', NOW() - INTERVAL '6 days'),
  ('55555555-5555-5555-5555-555555555555', 'scenario_run', 'free', 'SOL', '24h', 'scn-v1.0', '{"asset": "SOL"}', NOW() - INTERVAL '5 days'),
  ('55555555-5555-5555-5555-555555555555', 'scenario_run', 'free', 'ETH', '6h', 'scn-v1.0', '{"asset": "ETH"}', NOW() - INTERVAL '4 days'),
  ('55555555-5555-5555-5555-555555555555', 'scenario_run', 'free', 'BTC', '24h', 'scn-v1.0', '{"asset": "BTC"}', NOW() - INTERVAL '3 days'),
  ('55555555-5555-5555-5555-555555555555', 'feature_locked_view', 'free', 'BTC', '24h', 'scn-v1.0', '{"feature": "forensics"}', NOW() - INTERVAL '2 days');

-- 3. Generate sample forecasts
INSERT INTO upgrade_forecasts (forecast_date, preset_name, user_tier, run_count_bucket, predicted_upgrade_rate, confidence_score, sample_size) VALUES
  (CURRENT_DATE, 'CEX Inflows Spike', 'free', '0-2', 8.5, 0.75, 120),
  (CURRENT_DATE, 'CEX Inflows Spike', 'free', '3-5', 15.2, 0.82, 85),
  (CURRENT_DATE, 'CEX Inflows Spike', 'free', '6+', 24.1, 0.68, 45),
  (CURRENT_DATE, 'Accumulation Cluster', 'free', '0-2', 6.8, 0.71, 95),
  (CURRENT_DATE, 'Accumulation Cluster', 'free', '3-5', 12.8, 0.79, 67),
  (CURRENT_DATE, 'Accumulation Cluster', 'free', '6+', 19.5, 0.65, 32),
  (CURRENT_DATE, 'Distribution Wave', 'free', '0-2', 4.2, 0.69, 78),
  (CURRENT_DATE, 'Distribution Wave', 'free', '3-5', 9.1, 0.74, 54),
  (CURRENT_DATE, 'Distribution Wave', 'free', '6+', 16.3, 0.61, 28),
  (CURRENT_DATE, 'Whale Accumulation', 'free', '0-2', 7.3, 0.73, 89),
  (CURRENT_DATE, 'Whale Accumulation', 'free', '3-5', 13.7, 0.77, 61),
  (CURRENT_DATE, 'Whale Accumulation', 'free', '6+', 21.8, 0.64, 38);

-- 4. Generate model metrics
INSERT INTO model_daily_metrics (day, model_version, hit_rate_7d, hit_rate_30d, hit_rate_90d, avg_confidence, runs) VALUES
  (CURRENT_DATE, 'scn-v1.0', 0.72, 0.68, 0.71, 0.76, 142),
  (CURRENT_DATE - 1, 'scn-v1.0', 0.74, 0.69, 0.70, 0.75, 138),
  (CURRENT_DATE - 2, 'scn-v1.0', 0.71, 0.67, 0.69, 0.77, 156),
  (CURRENT_DATE - 3, 'scn-v1.0', 0.73, 0.70, 0.72, 0.74, 134);

-- Verify data was inserted
SELECT 'Analytics Events' as table_name, COUNT(*) as count FROM analytics_events
UNION ALL
SELECT 'Upgrade Forecasts', COUNT(*) FROM upgrade_forecasts
UNION ALL  
SELECT 'Model Metrics', COUNT(*) FROM model_daily_metrics;